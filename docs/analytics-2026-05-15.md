# Realm Blender — Analytics Report (May 15, 2026)

**Report window:** Apr 15 – May 15, 2026 (30 days)
**Pulled via:** `uploader/analytics-report.js` (YouTube Analytics API v2)

---

## Channel Totals (30d)

| Metric | Value |
|---|---|
| Views | 269 |
| Estimated minutes watched | 1,646 |
| Avg view duration | 367s (~6 min) |
| **Avg view percentage** | **9.87%** ⚠️ low |
| Subscribers gained | +4 (0 lost) |
| Likes | 9 |
| Comments | 2 |
| Shares | 0 ⚠️ |

---

## Traffic Sources

| Source | Views | % | Note |
|---|---|---|---|
| RELATED_VIDEO | 201 | 75% | Algorithm suggesting long-forms next to other videos — **the growth engine** |
| SUBSCRIBER | 41 | 15% | The 6 subs |
| NO_LINK_OTHER | 11 | 4% | |
| YT_CHANNEL / YT_OTHER_PAGE / EXT_URL | 4 each | | |
| PLAYLIST | 2 | <1% | Playlists not pulling |
| YT_SEARCH | 1 | <1% | ⚠️ SEO barely landing — should climb after May 15 tag fixes |
| NOTIFICATION | 1 | <1% | |

**Key insight:** Long-form *suggested-video* traffic carries the channel.
Shorts contributed **zero measurable views in this window**. The
"Shorts funnel → long-form" strategy is unproven; long-forms are the engine.

---

## Device Type

| Device | Views |
|---|---|
| Desktop | 140 |
| Mobile | 96 |
| TV | 17 |
| Tablet | 16 |

Desktop-first — confirms a long-form/study audience, not a Shorts/mobile one.

---

## Top Videos (by views, 30d)

| Title | Views | Avg View Dur | AVP% | Subs+ |
|---|---|---|---|---|
| Bioluminescent Ocean — 1hr Calm Focus | 103 | 466s | 12.6% ✅ | 1 |
| Enchanted Forest & Fireflies — 1hr | 43 | 345s | 9.5% | 0 |
| A Coffee Shop in Mordor — 1hr | 43 | 681s | **18.9%** ✅ best | 0 |
| Moonlit Lake — 1hr Calm Focus | 38 | 41s | **1.1%** 🔴 | 0 |
| A Karaoke Bar in Dragonstone — 1hr | 29 | 130s | 3.6% | 0 |
| A Ramen Shop in the Shire — 1hr | 8 | 152s | 4.2% | 0 |
| Hogwarts But It's Tokyo at 3AM — 2hr | 5 | 5s | 0.1% ⚠️ noise | 0 |

> ⚠️ **Hogwarts long-form 0.1%/5s is statistically NOISE, not a real signal.**
> With only 5 lifetime views, one or two early click-aways tank the average.
> The retention-curve pull (see Addendum) confirmed it returns no real curve.
> Do NOT treat this video as "broken" — it just hasn't been seen yet.

---

## Geography

100% United States (30 geo-attributed views). No international reach yet.

---

## Daily Trend (last 14d)

Channel was dormant May 1–5, then woke up:
- May 6: 7 views, +2 subs
- May 7: 86 views, +2 subs, 1 like  ← biggest day
- May 8: 66 views, 4 likes
- May 10–12: 38 / 29 / 40 views, steady

---

## 🔴 Action Items

> NOTE: items 1-2 were rewritten after the retention-curve pull (see Addendum).
> The original "Hogwarts is broken" item was based on a noise number and is
> retracted — Hogwarts long-form has only 5 views, nothing to diagnose yet.

1. **Moonlit Lake (L1L3TuG2ZvU) — real problem.** Retention curve shows the
   plateau collapses to 0.03 (noise floor) — even viewers who stay past the
   hook leave. Likely a music/loop issue (bad seam, repetitive, volume).
   Ear-check the music vs Mordor Coffee; re-do music or re-loop, then re-upload.
2. **Karaoke Bar Dragonstone (S8b0XTiUE6U) — same pattern.** Plateau also at
   0.03. Same diagnosis and fix as Moonlit Lake.
3. **Lean into long-form.** Suggested-video is the growth lever. Keep
   Shorts as a bonus, prioritize more 1-hour videos like Mordor Coffee.
4. **Replicate winners:** Mordor Coffee (18.9%) + Bioluminescent Ocean
   (12.6%) — single calm scene, strong cozy hook, music that holds a plateau.
5. **Re-run this report ~June 1** to confirm `YT_SEARCH` climbs after the
   May 15 tag/playlist SEO fixes.
6. **0 shares** — add a share prompt to descriptions + pinned comments.
7. **Hogwarts long-form** — no action. Too few views to judge. Re-pull its
   retention curve once it has 30+ views.

---

## Benchmarks to beat next report

- AVP%: 9.87% → target 15%+ channel-wide
- YT_SEARCH: 1 view → target 20+ (SEO compounding)
- Shares: 0 → target 5+

---

## ADDENDUM — Retention Curve Analysis (pulled May 15, 2026)

Pulled via `uploader/retention-all.js` (`elapsedVideoTimeRatio` dimension).
Only 5 videos had enough views for a real curve. The earlier "0.1% / 5s"
numbers on Hogwarts long-form were noise — that video has only 5 views, no
real curve. Correct picture below.

### Two distinct intro/content patterns emerged:

**Group A — WORKING (stable plateau, people actually study to it):**
| Video | Views | @40s | Hook-loss | @50% | @end |
|---|---|---|---|---|---|
| Bioluminescent Ocean | 107 | 0.41 | 59% | 0.10 | 0.06 |
| Enchanted Forest & Fireflies | 43 | 0.39 | 60% | 0.10 | 0.05 |
| **Coffee Shop Mordor** | 48 | 0.38 | 66% | **0.17** | **0.14** |

**Group B — BROKEN (plateau collapses to 0.03 = noise floor):**
| Video | Views | @40s | Hook-loss | @50% | @end |
|---|---|---|---|---|---|
| Karaoke Bar Dragonstone | 31 | 0.28 | 74% | 0.03 | 0.03 |
| Moonlit Lake | 38 | 0.16 | 85% | 0.03 | 0.03 |

### Diagnosis
- ALL videos lose ~60-85% in the first 40s — normal sampling for 1hr ambient.
- The real differentiator is the **plateau**, not the intro. Group A holds
  0.10-0.17 to the end (people leave it running). Group B flatlines at 0.03 —
  even survivors leave. That points at the **music/loop quality**, not the
  intro: bad loop seam, repetitive track, or volume/mix issue.
- **Mordor Coffee Shop (0.17 plateau) is the template** — copy its music
  approach and loop handling.
- **Action:** ear-check Moonlit Lake + Karaoke Dragonstone music vs Mordor.
  If the loop has an audible seam or gets repetitive, re-do the music (Suno)
  or re-loop in CapCut, then re-upload. Re-uploading the same file won't help.
- Hogwarts long-form: still 5 views, no data — cannot judge. Not "broken."

Caveat: 31-107 view samples are small. Strong signal, not proof. Recheck
after more traffic.
