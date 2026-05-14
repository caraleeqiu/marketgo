# Ideation — Plumber's X-Ray Storyteller

## Why this direction

Brainstormed several plumbing-related skill formats. Two filters from the
Hackathon scoring rules drove the choice:

1. **剧本类难度封顶 2 分** — anything dominated by a script (talking head,
   AI avatar narration) hits a ceiling.
2. **重叠 < 70%** — avoid formats already covered by existing Composition
   Skills on the Marketplace.

### Candidates evaluated

| Candidate | Verdict |
|---|---|
| 90s talking head explaining plumbing | ❌ Caps at 2pts (剧本类), and AI avatar destroys blue-collar trust |
| Disaster Re-enactment 小剧场 | ⚠️ Good production value, but reads as "营销号" — real tradespeople won't post it |
| Before/After Vision (imagined fix) | ⚠️ AI-generated "after" is a credibility risk if customer expects that result |
| **X-Ray Storyteller** | ✅ Real photo as trust anchor; AI only renders what cameras can't see |

### Trust framework that locked this in

> AI should not pretend to *be* the tradesperson.
> AI should render the thing the tradesperson is *talking about*.

What viewers accept as AI without losing trust:
- **Cutaway / X-ray visualization** — anatomy of a pipe inside a wall, mineral
  buildup inside a drain. Nobody expects a camera to capture this.
- **Decay timeline simulation** — "if you don't fix this, here's 6 months from
  now" — clearly speculative, not pretending to be footage.

## The format

A 45–75s vertical (9:16) educational video. Input: a single on-site photo +
a one-line problem description from the tradesperson.

```
[Shot 1]  Real photo, zoomed/annotated — "here's what's wrong"
[Shot 2]  AI X-ray animation — what's happening behind the wall / inside the pipe
[Shot 3]  AI decay timeline — 3 mo / 6 mo / 1 yr "if untreated"
[Shot 4]  Cut back to real photo with repair overlay/diagram
[Shot 5]  Tradesperson's signature card (name, service area, contact)
```

## Why this scores well

- **Out of 剧本类**: core artifacts are visual transformations, not scripts.
- **Differentiation**: X-ray cutaway + decay timeline is a combination not yet
  seen on the Marketplace (to be verified in next step).
- **Trust-first**: real photo is the anchor in shots 1 and 4; AI fills the
  middle where it can't lie.
- **Reusable beyond plumbing**: HVAC, electrical, roofing, pest control all
  share the same "I need to show the customer something they can't see" need.
  Plumbing is the v1 vertical.

## Boundaries (做不了什么)

- Cannot do without an on-site photo (photo is the trust anchor — no photo,
  no skill).
- Cannot do live-action talking-head footage.
- Cannot produce safety-critical specific repair instructions (we show the
  problem and general repair concept; actual repair advice is the
  tradesperson's job).
- Cannot exceed ~75s output.

## Marketplace overlap scan (2026-05-14)

Closest existing Composition Skills:

| Skill | Input | Output | Overlap |
|---|---|---|---|
| `knowledge-video` | Text topic | 3–5 min educational video | ~25% — both educational, but input modality, duration, and format are fundamentally different |
| `video-breakdown` | Video file | Analysis report | 0% — analytical, not generative |
| `visual-production` | Screenplay | Narrative film | 0% |
| `create-complex-music-video-from-music` | Music | Music video | 0% |

**Empty slots on the Marketplace we occupy:**
- photo-to-video pipeline
- X-ray / cutaway / internal-view animation
- decay-timeline / aging simulation
- blue-collar trades vertical (plumbing/HVAC/electrical)
- diagnostic/repair walkthrough

Verdict: overlap well under the 70% threshold; direction confirmed.

## Open questions for next steps

- Which video model handles X-ray / cutaway animation best? (Veo? Kling?)
- How do we lock visual consistency between Shot 1 (real photo) and Shot 4
  (real photo + overlay) so the viewer trusts continuity?
- Does the photo-to-X-ray transition need a dedicated atomic skill, or can
  it be done with a single image-to-video call + good prompt?
