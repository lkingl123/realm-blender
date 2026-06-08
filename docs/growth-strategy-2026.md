# Realm Blender — Growth Strategy (researched May 15, 2026)

> **⚠️ HISTORICAL SNAPSHOT — May 15, 2026.** This doc captures the strategy as of
> the channel's first month. The channel has evolved since:
> - Channel was 13 subs / 269 views (28d). Now (Jun 8): **20 subs / 4,663 lifetime**
> - Shorts were 20s. Now: **10s** (completion went from 30-50% to 60-85%)
> - Painterly Ghibli image style was the only style. Now: **photoreal pivot** in progress
> - Music tracks were ~3 min each. Now: **15-18 min target via Suno Extend**
> - Weather overlays were experimental. Now: **stripped entirely**
> - Daily-posting cadence wasn't proven yet. Now: **proven harmful** — splits impression budget
>
> Use this for historical context only. For current pipeline see `workflow.md`,
> for current prompts see `asset-prompts.md`, for current data run `analytics-report.js`.

---

Built from 2026 research + the May 15 analytics report (`analytics-2026-05-15.md`).
The channel's growth engine is **long-form suggested-video traffic** (75% of
views), not Shorts. Strategy below is built around that reality.

---

## 1. Retention — the #1 lever

**Channel AVP is 9.87%. Healthy ambient long-form = 35-50%.** Biggest gap to close.

### The first 30 seconds decide everything
- Most viewers leave in the first 30s. A sharp drop at 0:30 = hook problem.
- Losing >40% of viewers in the first 30s means the intro needs a rebuild.
- Target: hold 70%+ of viewers through the first 30 seconds.

### Intro structure for ambient long-form
- **0:00-0:05** — Visual hook. The scene must be striking on frame 1. No
  logo, no channel intro, no slow fade from black. Start ON the scene.
- **0:05-0:15** — The music is already playing and settled (not building).
- **0:15-0:30** — Title text appears and fades; ambience is fully immersive.
- DON'T: long black-screen fades, silent intros, title cards before the scene.

### Known retention failures (from the retention-curve analysis)
- **Moonlit Lake & Karaoke Bar Dragonstone** — the real problems. Retention
  curves show their plateau collapses to 0.03 (noise floor): even viewers who
  survive the hook still leave. Diagnosis points at the **music/loop**, not
  the intro — bad loop seam, repetitive track, or volume/mix. Fix: ear-check
  the music vs Mordor Coffee, re-do music or re-loop, then re-upload.
- **Hogwarts Tokyo 3AM** — NOT a known failure. The earlier "0.1% AVP / 5s"
  was statistical noise (only 5 views). No real retention curve exists yet.
  Don't diagnose or re-cut it — just let it accumulate views.
- **Mordor Coffee Shop** is the template — 0.17 plateau, holds to the end.

### Pattern interrupt
- A subtle change ~25-35s in (gentle ambient layer enters, light shift)
  refocuses attention right when viewers drift. Not jarring — ambient-safe.

---

## 2. Suggested-video traffic — the growth engine

75% of views come from RELATED_VIDEO. To get recommended more:

- **Topic focus is everything.** Once a channel has ~20 videos on one tight
  topic, those videos start suggesting *each other* and appearing next to
  similar creators. Realm Blender's "fantasy x real life ambient" niche is
  correctly tight — keep it that way, don't drift into generic lofi.
- **Retention drives placement.** Videos with 70%+ retention get priority in
  the suggested sidebar. Fixing retention (section 1) directly grows reach.
- **Videos that lead to more watching** get more suggested placements — so
  end screens linking to the next Realm Blender video matter.
- Consistent uploads in the same topic compound this effect.

---

## 3. Thumbnails — CTR

Ambient/music CTR benchmark: 4-6% is average, 7%+ is great.

- **Contrast over color.** Bright saturated subject on a dark/neutral
  background. The current yellow-on-image style is fine IF contrast is high.
- **One or two hero elements.** Don't cram. The mashup contrast (fantasy +
  mundane) IS the hook — make it instantly readable at phone size.
- **Text: 3-4 words max**, bold sans-serif, legible at 168x94px. 52% of new
  creators get <2% CTR purely from unreadable fonts.
- **No "YouTube face"** — not applicable here anyway (faceless), good.
- **Use Test & Compare** — upload 3 thumbnail variants per video; YouTube
  picks the winner by watch-time share. Free A/B testing, use it on every
  long-form going forward.

---

## 4. Shorts funnel — recalibrated

The funnel works. Jake is intentionally experimenting with Shorts volume —
**there is no fixed cadence rule.** Notes below are context, not a cap:

- Long-form viewers convert to real fans at ~3x the rate of Shorts viewers.
  Shorts inflate sub count; long-form builds the actual audience.
- **Research-backed default (if unsure):** 2-3 Shorts/week (~30 min production
  each) + 1 long-form every 1-2 weeks at full quality. Deviate freely while
  experimenting.
- **The one hard rule:** Shorts volume must never eat into long-form
  production quality. Long-form is the growth engine — protect it. Experiment
  with Shorts as much as wanted, just not at long-form's expense.
- Each Short: 30-45s of the most compelling moment + pinned comment linking
  the full video + on-screen "Full video on the channel" CTA. (Already done —
  Shorts have the link. Just need the manual pin.)

---

## 5. Other gaps from the report

- **0 shares in 30 days.** Add a soft share line to long-form descriptions
  and pinned comments ("Send this to someone who needs to focus tonight").
- **100% US audience.** Not a problem early on, but titles/tags in plain
  English already help international discovery later.
- **1 search view in 30 days.** The May 15 tag/playlist SEO fixes should
  compound. Re-check `YT_SEARCH` in the June report.
- **End screens** — add end screens to every long-form pointing to the next
  Realm Blender video (boosts session time + suggested placement).

---

## Priority order (do in this sequence)

1. Fix Moonlit Lake + Karaoke Dragonstone — their plateau collapses to 0.03.
   Ear-check the music/loop vs Mordor Coffee; re-do music or re-loop, re-upload.
2. Apply the 0-30s intro structure to ALL future long-form renders.
3. Add end screens + Test & Compare thumbnails to every new long-form.
4. Keep experimenting with Shorts freely — just make sure long-form quality
   never suffers for it (long-form is the growth engine).
5. Add share CTAs. Manually pin engagement comments.
6. Re-run `analytics-report.js` ~June 1; compare against benchmarks.

## Benchmarks to beat (next report)
- AVP%: 9.87% -> 15%+ (then 35%+ long-term)
- CTR: target 4-6%+ (check in Studio)
- YT_SEARCH: 1 -> 20+
- Shares: 0 -> 5+

---

## Sources
- socialrails.com — YouTube Audience Retention 2026
- 1of10.com — Hook Viewers in First 30 Seconds
- air.io — Advanced Retention Editing
- miraflow.ai / ytshark.com — YouTube Algorithm 2026
- awisee.com / unkoa.com — Thumbnail Best Practices 2026
- chartlex.com — Shorts vs Long-Form for Musicians 2026
- joinbrands.com — YouTube Shorts Best Practices 2026
