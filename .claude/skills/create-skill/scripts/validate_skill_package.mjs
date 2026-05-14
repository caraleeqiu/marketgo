#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const AUTHORING_COMMAND = /\bdl\s+skill\s+(draft-create|draft-update|validate|compile|activate|fork|search)\b/g;
const ARTIFACT_CONTRACT_COMMAND = /^dl\s+artifact\s+(write|finalize|validate)\b|^-\s+`dl\s+artifact\s+(write|finalize|validate)\b/;
const PATCH_JSON_COMMAND = /^dl\s+artifact\s+patch-json\b|^-\s+`dl\s+artifact\s+patch-json\b/;
const SUPPORTED_PATCH_JSON_OPS = new Set(["set", "merge", "append", "delete"]);

const PROTOCOL_WRAPPER_REQUIRED = ["slot", "display_name", "status", "version", "content_layout", "content"];
const PROTOCOL_LAYOUT_TYPES = ["single", "list", "grid", "form"];
const PROTOCOL_COMPONENT_TYPES = ["card", "markdown", "code", "image", "video", "music", "form_field"];

function readText(path) {
	return readFileSync(path, "utf8");
}

function parseJsonFile(path, issues, warnings) {
	try {
		return JSON.parse(readText(path));
	} catch (error) {
		issues.push(`${path}: invalid JSON: ${error.message}`);
		return undefined;
	}
}

function walkFiles(root) {
	const out = [];
	for (const entry of readdirSync(root)) {
		const path = join(root, entry);
		const stat = statSync(path);
		if (stat.isDirectory()) {
			out.push(...walkFiles(path));
		} else if (stat.isFile()) {
			out.push(path);
		}
	}
	return out;
}

function extractFrontmatter(text) {
	const lines = text.split(/\r?\n/);
	if (lines[0] !== "---") return undefined;
	const end = lines.findIndex((line, index) => index > 0 && line === "---");
	if (end === -1) return undefined;
	return lines.slice(1, end).join("\n");
}

function scalar(frontmatter, key) {
	const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
	if (!match) return undefined;
	return match[1].replace(/^["']|["']$/g, "").trim();
}

function hasDescription(frontmatter) {
	return /^description:\s*(.+)?$/m.test(frontmatter);
}

function metadataKind(frontmatter) {
	const match = frontmatter.match(/^\s+kind:\s*(atomic_skill|composition_skill)\s*$/m);
	return match?.[1];
}

function futureSectionRange(lines) {
	const start = lines.findIndex((line) => /^## Future Skill-Forge Commands\s*$/.test(line));
	if (start === -1) return undefined;
	let end = lines.length;
	for (let index = start + 1; index < lines.length; index++) {
		if (/^##\s+/.test(lines[index])) {
			end = index;
			break;
		}
	}
	return { start, end };
}

function inRange(index, range) {
	return range !== undefined && index >= range.start && index < range.end;
}

function auditUnsupportedCommands(skillText) {
	const lines = skillText.split(/\r?\n/);
	const futureRange = futureSectionRange(lines);
	const findings = [];
	lines.forEach((line, index) => {
		AUTHORING_COMMAND.lastIndex = 0;
		if (AUTHORING_COMMAND.test(line) && !inRange(index, futureRange)) {
			findings.push(`line ${index + 1}: ${line.trim()}`);
		}
	});
	return {
		current_pi_execution_path_clean: findings.length === 0,
		future_section_present: futureRange !== undefined,
		findings,
	};
}

function commandWindow(lines, index) {
	const block = [lines[index] ?? ""];
	for (let offset = index + 1; offset < Math.min(lines.length, index + 12); offset++) {
		const line = lines[offset] ?? "";
		if (/^\s*$/.test(line)) break;
		if (/^\s*```/.test(line)) break;
		if (/^\s*-\s+`?dl\s+artifact\s+/.test(line)) break;
		if (/^\s*dl\s+artifact\s+/.test(line)) break;
		block.push(line);
	}
	return block.join("\n");
}

function auditArtifactContractUsage(markdownFiles) {
	const contractFindings = [];
	const patchJsonFindings = [];
	for (const file of markdownFiles) {
		const lines = readText(file).split(/\r?\n/);
		lines.forEach((line, index) => {
			ARTIFACT_CONTRACT_COMMAND.lastIndex = 0;
			if (ARTIFACT_CONTRACT_COMMAND.test(line) && !line.includes("--help")) {
				const window = commandWindow(lines, index);
				if (!/--contract=/.test(window)) {
					contractFindings.push(`${file}: line ${index + 1} artifact write/finalize/validate command is missing --contract`);
				}
			}

			PATCH_JSON_COMMAND.lastIndex = 0;
			if (PATCH_JSON_COMMAND.test(line) && !line.includes("--help")) {
				const window = commandWindow(lines, index);
				if (/--contract(?:=|\s)/.test(window)) {
					patchJsonFindings.push(`${file}: line ${index + 1} patch-json must not include --contract; finalize with --contract afterward`);
				}
				if (/--patch(?:=|\s)/.test(window)) {
					patchJsonFindings.push(`${file}: line ${index + 1} patch-json uses --operations, not --patch`);
				}
				for (const match of window.matchAll(/"op"\s*:\s*"([^"]+)"/g)) {
					const op = match[1];
					if (!SUPPORTED_PATCH_JSON_OPS.has(op)) {
						patchJsonFindings.push(`${file}: line ${index + 1} patch-json op '${op}' is unsupported`);
					}
				}
				if (/"path"\s*:\s*"\//.test(window)) {
					patchJsonFindings.push(`${file}: line ${index + 1} patch-json paths use JSONPath-lite such as field.name, not /field/name`);
				}
			}
		});
	}
	const patchJsonSyntaxFindings = patchJsonFindings.filter((finding) => !finding.includes("must not include --contract"));
	return {
		write_finalize_validate_calls_include_contract: contractFindings.length === 0,
		patch_json_uses_supported_operations: patchJsonSyntaxFindings.length === 0,
		patch_json_omits_contract: patchJsonFindings.every((finding) => !finding.includes("must not include --contract")),
		findings: [...contractFindings, ...patchJsonFindings],
	};
}

// Artifact Protocol 0508 compliance check —— run on each user-visible slot's
// schema. Wrapper level must require the 6 protocol fields, the slot const
// must match, layout_type must be one of the 4 protocol layouts, and content
// items must require id + component_type at minimum.
function checkSlotSchemaShape(schema, slotName) {
	const findings = [];

	if (!schema || typeof schema !== "object") {
		findings.push("schema is not a JSON object");
		return findings;
	}

	const required = Array.isArray(schema.required) ? schema.required : [];
	for (const field of PROTOCOL_WRAPPER_REQUIRED) {
		if (!required.includes(field)) {
			findings.push(`root.required is missing wrapper field '${field}'`);
		}
	}

	const slotConst = schema?.properties?.slot?.const;
	if (slotConst !== slotName) {
		findings.push(`properties.slot.const must equal '${slotName}' (got ${JSON.stringify(slotConst)})`);
	}

	const statusEnum = schema?.properties?.status?.enum;
	if (!Array.isArray(statusEnum) || !statusEnum.includes("draft") || !statusEnum.includes("verified")) {
		findings.push("properties.status.enum must include 'draft' and 'verified'");
	}

	const versionType = schema?.properties?.version?.type;
	if (versionType !== "integer") {
		findings.push("properties.version.type must be 'integer'");
	}

	const layoutType = schema?.properties?.content_layout?.properties?.layout_type?.const;
	if (!PROTOCOL_LAYOUT_TYPES.includes(layoutType)) {
		findings.push(`properties.content_layout.properties.layout_type.const must be one of ${PROTOCOL_LAYOUT_TYPES.join("/")} (got ${JSON.stringify(layoutType)})`);
	}

	const contentSchema = schema?.properties?.content;
	if (!contentSchema || contentSchema.type !== "array") {
		findings.push("properties.content.type must be 'array'");
		return findings;
	}

	// content.items can be a single schema (most common), tuple array, or have
	// allOf/oneOf branches. We support the common single-schema shape; complex
	// shapes get a softer warning rather than hard fail.
	const itemSchema = contentSchema.items;
	if (!itemSchema || typeof itemSchema !== "object" || Array.isArray(itemSchema)) {
		findings.push("properties.content.items must be a single object schema; tuple/array form not yet supported by validator");
		return findings;
	}

	const itemRequired = Array.isArray(itemSchema.required) ? itemSchema.required : [];
	for (const field of ["id", "component_type"]) {
		if (!itemRequired.includes(field)) {
			findings.push(`properties.content.items.required must include '${field}'`);
		}
	}

	const componentConst = itemSchema?.properties?.component_type?.const;
	if (componentConst !== undefined && !PROTOCOL_COMPONENT_TYPES.includes(componentConst)) {
		findings.push(`properties.content.items.properties.component_type.const must be one of ${PROTOCOL_COMPONENT_TYPES.join("/")} (got ${JSON.stringify(componentConst)})`);
	}

	if (!itemRequired.includes("detail")) {
		findings.push("properties.content.items.required must include 'detail' (null for non-segment, { variant: 'media_player' } for segment)");
	}

	return findings;
}

function validateProtocolCompliance(contract, contractPath, root, issues, warnings) {
	if (!contract?.slots || typeof contract.slots !== "object") {
		return { all_user_visible_slots_match_protocol: true, slots_checked: [], findings: [] };
	}

	const findings = [];
	const slotsChecked = [];

	for (const [slotName, slot] of Object.entries(contract.slots)) {
		if (!slot || typeof slot !== "object") continue;
		// Opt-out for internal / non-user-rendered slots (e.g. create-skill's
		// own bookkeeping artifacts). Default true if flag absent.
		if (slot.user_visible === false) continue;
		if (typeof slot.schema_ref !== "string" || slot.schema_ref.length === 0) continue;

		const schemaPath = join(root, slot.schema_ref);
		if (!existsSync(schemaPath)) continue; // already reported by upstream check

		const schema = parseJsonFile(schemaPath, issues, warnings);
		if (!schema) continue;

		const slotFindings = checkSlotSchemaShape(schema, slotName);
		if (slotFindings.length) {
			for (const finding of slotFindings) {
				findings.push(`${relative(root, schemaPath)} (slot=${slotName}): ${finding}`);
			}
		}
		slotsChecked.push(slotName);
	}

	return {
		all_user_visible_slots_match_protocol: findings.length === 0,
		slots_checked: slotsChecked,
		findings,
	};
}

// Cross-check between Phase 2 _design/skill_structure.json artifact_layout_plan
// and the actual slot schemas. Skipped when the design file is absent (the
// design doc isn't a hard runtime requirement; cross-check is opportunistic).
function validateLayoutPlanCrossRef(contract, root, issues, warnings) {
	const designPath = join(root, "_design", "skill_structure.json");
	if (!existsSync(designPath)) {
		return {
			ran: false,
			ok: true,
			findings: [],
			note: "_design/skill_structure.json not present; cross-check skipped",
		};
	}

	const design = parseJsonFile(designPath, issues, warnings);
	const plan = Array.isArray(design?.artifact_layout_plan) ? design.artifact_layout_plan : null;
	if (!plan) {
		return {
			ran: false,
			ok: true,
			findings: [],
			note: "_design/skill_structure.json has no artifact_layout_plan; cross-check skipped",
		};
	}

	const findings = [];
	const slots = (contract && typeof contract.slots === "object") ? contract.slots : {};

	for (const planEntry of plan) {
		const slotName = planEntry?.slot;
		if (!slotName) continue;
		const slot = slots[slotName];
		if (!slot || typeof slot.schema_ref !== "string") continue;

		const schemaPath = join(root, slot.schema_ref);
		if (!existsSync(schemaPath)) continue;
		const schema = parseJsonFile(schemaPath, issues, warnings);
		if (!schema) continue;

		const schemaLayout = schema?.properties?.content_layout?.properties?.layout_type?.const;
		if (planEntry.layout_type && schemaLayout && schemaLayout !== planEntry.layout_type) {
			findings.push(`slot '${slotName}': layout_plan.layout_type='${planEntry.layout_type}' but schema content_layout.layout_type.const='${schemaLayout}'`);
		}

		const itemSchema = schema?.properties?.content?.items;
		const schemaComponent = itemSchema?.properties?.component_type?.const;
		if (planEntry.primary_component_type && schemaComponent && schemaComponent !== planEntry.primary_component_type) {
			findings.push(`slot '${slotName}': layout_plan.primary_component_type='${planEntry.primary_component_type}' but schema content.items.component_type.const='${schemaComponent}'`);
		}

		if (planEntry.primary_component_type === "card" && planEntry.card_variant) {
			const schemaVariant = itemSchema?.properties?.variant?.const;
			if (schemaVariant && schemaVariant !== planEntry.card_variant) {
				findings.push(`slot '${slotName}': layout_plan.card_variant='${planEntry.card_variant}' but schema content.items.variant.const='${schemaVariant}'`);
			}
		}

		if (planEntry.primary_component_type === "form_field" && planEntry.display_type) {
			const schemaDisplayEnum = itemSchema?.properties?.display_type?.enum;
			const schemaDisplayConst = itemSchema?.properties?.display_type?.const;
			if (Array.isArray(schemaDisplayEnum) && !schemaDisplayEnum.includes(planEntry.display_type)) {
				findings.push(`slot '${slotName}': layout_plan.display_type='${planEntry.display_type}' is not in schema content.items.display_type.enum=${JSON.stringify(schemaDisplayEnum)}`);
			} else if (schemaDisplayConst && schemaDisplayConst !== planEntry.display_type) {
				findings.push(`slot '${slotName}': layout_plan.display_type='${planEntry.display_type}' but schema content.items.display_type.const='${schemaDisplayConst}'`);
			}
		}

		const detailVariant = itemSchema?.properties?.detail?.properties?.variant?.const;
		const detailType = itemSchema?.properties?.detail?.type;
		if (planEntry.is_segment === true && detailVariant !== "media_player") {
			findings.push(`slot '${slotName}': layout_plan.is_segment=true but schema content.items.detail.properties.variant.const is not 'media_player'`);
		}
		if (planEntry.is_segment === false && detailVariant === "media_player") {
			findings.push(`slot '${slotName}': layout_plan.is_segment=false but schema content.items.detail.properties.variant.const='media_player'`);
		}
		if (planEntry.is_segment === false && detailType !== "null") {
			findings.push(`slot '${slotName}': layout_plan.is_segment=false but schema content.items.detail.type is not 'null'`);
		}

		const layoutConfig = schema?.properties?.content_layout?.properties?.config?.properties;
		if (planEntry.layout_type === "grid" && planEntry.layout_config?.columns) {
			const schemaColumns = layoutConfig?.columns;
			const schemaColumnsConst = schemaColumns?.const;
			const schemaColumnsMin = schemaColumns?.minimum;
			const schemaColumnsMax = schemaColumns?.maximum;
			if (schemaColumnsConst !== undefined && schemaColumnsConst !== planEntry.layout_config.columns) {
				findings.push(`slot '${slotName}': layout_plan.layout_config.columns=${planEntry.layout_config.columns} but schema columns.const=${schemaColumnsConst}`);
			} else if (
				schemaColumnsConst === undefined &&
				typeof schemaColumnsMin === "number" &&
				typeof schemaColumnsMax === "number" &&
				(planEntry.layout_config.columns < schemaColumnsMin || planEntry.layout_config.columns > schemaColumnsMax)
			) {
				findings.push(`slot '${slotName}': layout_plan.layout_config.columns=${planEntry.layout_config.columns} is outside schema columns range [${schemaColumnsMin}, ${schemaColumnsMax}]`);
			}
		}
	}

	return { ran: true, ok: findings.length === 0, findings };
}

function validate(rootArg) {
	const root = resolve(rootArg);
	const issues = [];
	const warnings = [];
	const skillPath = join(root, "SKILL.md");
	if (!existsSync(skillPath)) {
		issues.push(`${skillPath}: missing SKILL.md`);
		return { root, issues, warnings };
	}

	const skillText = readText(skillPath);
	const frontmatter = extractFrontmatter(skillText);
	if (!frontmatter) {
		issues.push(`${skillPath}: missing YAML frontmatter`);
	}

	const name = frontmatter ? scalar(frontmatter, "name") : undefined;
	const descriptionOk = frontmatter ? hasDescription(frontmatter) : false;
	const kind = frontmatter ? metadataKind(frontmatter) : undefined;
	const artifactContractRef = frontmatter ? scalar(frontmatter, "artifact-contract") : undefined;

	if (!name) issues.push(`${skillPath}: frontmatter name is required`);
	if (!descriptionOk) issues.push(`${skillPath}: frontmatter description is required`);
	if (name && basename(root) !== name) {
		issues.push(`${skillPath}: folder name '${basename(root)}' does not match frontmatter name '${name}'`);
	}

	const markdownFiles = walkFiles(root).filter((file) => file.endsWith(".md"));
	const artifactUsage = auditArtifactContractUsage(markdownFiles);
	if (
		!artifactUsage.write_finalize_validate_calls_include_contract ||
		!artifactUsage.patch_json_uses_supported_operations ||
		!artifactUsage.patch_json_omits_contract
	) {
		issues.push(...artifactUsage.findings);
	}

	const usesArtifacts = /\bdl\s+artifact\b/.test(skillText);
	if (usesArtifacts && !artifactContractRef) {
		issues.push(`${skillPath}: artifact-backed skill is missing artifact-contract frontmatter`);
	}

	const parsedSchemas = [];
	const parsedTemplates = [];
	let artifactContractOk = !artifactContractRef;
	let contract;
	if (artifactContractRef) {
		const contractPath = join(root, artifactContractRef);
		if (!existsSync(contractPath)) {
			issues.push(`${contractPath}: artifact contract not found`);
		} else {
			contract = parseJsonFile(contractPath, issues, warnings);
			artifactContractOk = Boolean(contract);
			if (contract?.slots && typeof contract.slots === "object") {
				for (const [slotName, slot] of Object.entries(contract.slots)) {
					if (!slot || typeof slot !== "object") continue;
					const schemaRef = slot.schema_ref;
					if (typeof schemaRef !== "string" || schemaRef.length === 0) {
						issues.push(`${contractPath}: slot '${slotName}' is missing schema_ref`);
						continue;
					}
					const schemaPath = join(root, schemaRef);
					if (!existsSync(schemaPath)) {
						issues.push(`${schemaPath}: schema_ref for slot '${slotName}' not found`);
						continue;
					}
					if (parseJsonFile(schemaPath, issues, warnings)) parsedSchemas.push(schemaPath);
				}
			}
		}
	}

	for (const file of walkFiles(root).filter((path) => /\/templates\/.+\.json$/.test(path))) {
		if (parseJsonFile(file, issues, warnings)) parsedTemplates.push(file);
	}

	const unsupportedCommandAudit = auditUnsupportedCommands(skillText);
	if (!unsupportedCommandAudit.current_pi_execution_path_clean) {
		issues.push(...unsupportedCommandAudit.findings.map((finding) => `${skillPath}: unsupported Pi authoring command outside future section: ${finding}`));
	}

	let protocolCompliance = { all_user_visible_slots_match_protocol: true, slots_checked: [], findings: [] };
	let layoutPlanCrossCheck = { ran: false, ok: true, findings: [], note: "skipped: no contract" };
	if (contract) {
		protocolCompliance = validateProtocolCompliance(contract, artifactContractRef ? join(root, artifactContractRef) : null, root, issues, warnings);
		if (!protocolCompliance.all_user_visible_slots_match_protocol) {
			issues.push(...protocolCompliance.findings.map((f) => `protocol_compliance: ${f}`));
		}
		layoutPlanCrossCheck = validateLayoutPlanCrossRef(contract, root, issues, warnings);
		if (!layoutPlanCrossCheck.ok) {
			issues.push(...layoutPlanCrossCheck.findings.map((f) => `layout_plan_cross_check: ${f}`));
		}
	}

	const result = {
		ok: issues.length === 0,
		root,
		skillName: name ?? null,
		metadataKind: kind ?? null,
		checks: {
			frontmatter: Boolean(name && descriptionOk),
			artifact_contract: artifactContractOk,
			schemas: parsedSchemas.length > 0 || !artifactContractRef,
			templates: parsedTemplates.length > 0,
			protocol_compliance: protocolCompliance.all_user_visible_slots_match_protocol,
		},
		unsupported_command_audit: unsupportedCommandAudit,
		artifact_contract_usage: artifactUsage,
		protocol_compliance: protocolCompliance,
		layout_plan_cross_check: layoutPlanCrossCheck,
		parsedSchemas: parsedSchemas.map((file) => relative(root, file)),
		parsedTemplates: parsedTemplates.map((file) => relative(root, file)),
		issues,
		warnings,
	};
	return result;
}

const target = process.argv[2];
if (!target) {
	console.error("Usage: node validate_skill_package.mjs <skill-directory>");
	process.exit(2);
}

const result = validate(target);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
