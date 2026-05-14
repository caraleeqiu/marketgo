# Atomic Skill Mapping — Plumber's X-Ray Storyteller

Mapped against the Hackathon atomic skill list (2026-05-14).

## Capability → atomic skill

| # | Need | Atomic skill | Model / CLI | Notes |
|---|---|---|---|---|
| 1 | Photo diagnosis (VLM) | *Agent-native vision* | — | Not an atomic skill; Claude's built-in capability |
| 2 | Annotate real photo (red circle + label) | `remotion` | `dl remotion` | Code-driven motion graphics; tradesperson info passed as props |
| 3 | Shot 1 photo zoom-in motion | `video-generation` | `dl generate-video` i2v | Veo 3.1 / Kling 3.0 |
| 4 | Photo → X-ray stylization | `image-generation` | banana-2 (Imagen4 4K) | Style transform of the real photo |
| 5 | X-ray cutaway animation (core) | `video-generation` | `dl generate-video` i2v | Driven by the #4 X-ray keyframe; Veo 3.1 strong on conceptual animation |
| 6 | Decay timeline | `image-generation` → `video-generation` | gpt-image-2 (best multi-image edit) → i2v | gpt-image-2 keeps the 3 progressive decay frames consistent |
| 7 | Multi-shot concat + transitions | `ffmpeg` | `dl ffmpeg` | concat / overlay / final mux |
| 8 | Narration (optional) | `tts` / `create-voice` | minimax-tts | See decision point — narration risks 剧本类 classification |
| 9 | BGM / SFX | `search-audio` + `ffmpeg` | `dl knowledge search --domain=bgm\|sfx` | No dialogue, so `add-audio-cues` explicitly does not apply |
| 10 | Keyword captions / kinetic typography | `remotion` | `dl remotion` | |
| 11 | Tradesperson signature outro card | `remotion` | `dl remotion` | Data-driven: name / phone / service area as props |

## Deliberately NOT used

`lipsync`, `motion-control`, `create-voice` — these are the talking-head /
dance-video primitives. Not using them is what structurally separates this
skill from Trending Dance and digital-human skills (overlap < 70%).

Also unused: `video-breakdown`, `audio-transcription`, `stock-media`,
`location-exploration`, `search-meme`, `external-research` — none fit a
photo-anchored diagnostic video. (`media-download` may be a minor convenience
if the user supplies a photo via a social URL.)

## Engine selection & degradation

- **video-generation primary:** Veo 3.1 (native audio + strong conceptual
  animation). Fallback chain: Kling 3.0 → Seedance 1.5/2.0.
- **image-generation:** banana-2 for X-ray stylization (4K); gpt-image-2 for
  the decay frame set (consistent multi-image edits).
- Keep each generated clip short (~5–8s). 5 shots ≈ 45–75s total — within the
  product's stated ceiling.

## Hidden workhorse: remotion

remotion covers annotation overlay (Shot 1), keyword typography, decay-stage
labels, and the signature outro card. Because it is data-driven, the
tradesperson's branding plugs in as props — this is also what makes the skill
reusable across HVAC / electrical / roofing later.

## Resolved decisions (2026-05-14)

1. **Narration: clone the tradesperson's real voice.** Use `create-voice` to
   clone from an audio sample, then `tts` to generate narration. Highest trust
   (it is literally the tradesperson's voice) and consistent with the
   "AI never plays the person" philosophy.
   - **剧本类 risk mitigation:** the narration script is kept very short
     (8–12 spoken lines for a ~60s video) and is *never a standalone
     confirmation artifact* — it lives inside the `diagnosis_plan` card. The
     three confirmation artifacts stay visual/structural (diagnosis → X-ray
     keyframe → final video), and the heaviest artifact is the X-ray cutaway
     animation, not a screenplay.
   - **Degradation:** cloned voice (needs audio sample) → minimax-tts generic
     → captions only.
2. **Signature card: optional input + generic fallback.** If the tradesperson
   supplies branding info (name / phone / service area) → personalized Shot 5;
   if not → generic "contact your local plumber" CTA card.

