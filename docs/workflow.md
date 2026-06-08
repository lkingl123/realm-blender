# Realm Blender — Complete Workflow Documentation

*Last updated: June 8, 2026. Reflects the current 12-script pipeline. For historical earlier-pipeline docs see `growth-strategy-2026.md` (May 15 snapshot) and `analytics-2026-05-15.md`.*

## Channel Info
- **Channel**: Realm Blender (@realmblender)
- **Channel ID**: `UCcEeW-W_HSW4_eHrW0d7XDA`
- **Concept**: Mashup of iconic fictional locations with mundane real-world establishments
- **Format**: 1-hour ambient study/sleep long-forms + 10-second YouTube Shorts as trailers
- **Google Cloud Project**: `realm-blender` (ID: 715469148362)

---

## Project structure

```
realm-blender/
├── images/              # Kling-generated scene PNGs (~2720x1536). GITIGNORED — local-only.
├── music/<slug>/        # Suno-generated mp3s, one folder per theme. GITIGNORED.
├── renders/             # 1-hour long-form mp4s (~150MB each). GITIGNORED.
├── shorts/              # 10s vertical mp4s. GITIGNORED.
├── thumbnails/          # 1280x720 JPGs (small, in repo).
├── docs/                # this file + asset-prompts + analytics snapshots
├── README.md            # top-level quickstart
├── channel-banner.png
├── channel-profile.png
└── uploader/            # all 17 active JS scripts + auth + fonts
```

Raw assets are gitignored — regenerate from prompts (see `asset-prompts.md`) on a new machine.

---

## The 12 active scripts (uploader/)

| Script | Purpose |
|---|---|
| `auth.js` | Google OAuth (port 3456, scopes for upload + analytics + comments) |
| `themes.js` | THE source of truth — every theme defined ONCE |
| `upload.js` | Core `uploadVideo()` primitive — exported, used by other scripts |
| `make-longform.js <slug\|all>` | 1-hour ambient mp4 from image + music/<slug>/*.mp3 |
| `make-short.js <slug\|all>` | 10s vertical Short with rotating CTA from pool |
| `make-rb-thumbnails.js <slug\|all>` | Bold-text thumbnail (May 27 redesign — high-CTR style) |
| `apply-thumbnails.js [--go]` | Bulk push thumbnails to LIVE videos via API |
| `upload-pair.js <slug>` | Daily driver — uploads long + Short + thumbnail + pinned comment + playlists |
| `build-upload-index.js` | Channel ↔ slug map. Uses `playlistItems` + `search.list` UNION (Jun 7 fix). |
| `analytics-report.js` | Channel-wide stats (28d window, traffic sources, AVP%, top videos) |
| `traffic-per-video.js` | Per-video traffic source breakdown |
| `subs-report.js` | Sub gain/loss attribution per video |

Plus livestream-set (kept for reference but ABANDONED — see memory): `stream-247.js`, `stream-247-auto.js`, `build-megamix.js`, `sub-watcher.js`, `rebuild-playlists.js`.

---

## Workflow (per theme, end-to-end)

```
1. Drop image into  images/<slug>.png   (Kling / Midjourney — see asset-prompts.md)
2. Drop music into  music/<slug>/*.mp3  (Suno — see asset-prompts.md)
3. Add slug entry to       uploader/themes.js
4. Add COPY entry to       uploader/upload-pair.js
5. node uploader/make-longform.js <slug>      # ~10 min render
6. node uploader/make-short.js <slug>         # ~30 sec render
7. node uploader/make-rb-thumbnails.js <slug> # thumbnail
8. node uploader/upload-pair.js <slug>        # uploads long + short + thumb + comment
9. node uploader/build-upload-index.js        # refresh the local index
```

After step 8, also do these in YouTube Studio (API can't):
- **Pin the comment** on the Short
- **Check the long-form survived the 6hr Content-ID window** (Paris's first upload got auto-removed; Suno music has been flagging occasionally)

---

## Key facts that are baked into the scripts

- **categoryId is `10` (Music)** on every upload — NEVER 22 (People & Blogs)
- **Short duration is 10 seconds** (changed May 28 from 20s — completion jumped from ~40% to 60-85%)
- **No weather overlays in Shorts** — stripped May 28, code refs are comments only
- **Thumbnails are bold sans-serif white text** with black stroke + yellow accent — Montserrat-ExtraBold only
- **Short CTAs rotate** from a pool of 8 small-creator sub-asks (added Jun 2, killed the "every Short ends identical" perception)
- **Long-form loudness:** `-18 LUFS` (gentler than YouTube's -14, right for sleep/ambient)
- **Channel ID hardcoded** as `UCcEeW-W_HSW4_eHrW0d7XDA`

---

## Flow 1: Image generation (Kling AI — photoreal recipe)

**Tool:** Kling AI (or Midjourney `--ar 16:9 --v 6 --style raw --s 50`)
**Output:** 2720x1536 PNG, ~5-7MB
**Style as of Jun 2026:** photoreal (the painterly Ghibli look was the channel's identity through May; Prague / Edinburgh / Cabin pivoted to photoreal — early data shows photoreal pulls views better)

See `asset-prompts.md` for the full prompt template. Drop output into `images/<slug>.png`.

---

## Flow 2: Music generation (Suno AI — longer-tracks recipe)

**Tool:** Suno AI Custom Mode + Instrumental toggle
**Target:** 15-20 minutes of total music across 2-3 tracks (loops better over 1 hour than 6 short tracks)

**Recipe (as of Jun 3):**
1. Generate 2-3 times with the prompt → 4-6 base tracks (~2 min each)
2. Pick the 2-3 best
3. **Click Suno's "Extend" button on each** → adds ~2 more min that flows from the end
4. Target 4-6 min per track, 15-18 min total

Why: King's Landing Jazz (21 min mix) and Winterfell Piano Bar (18 min mix) are top sub-converters. Paris/Rome/Cabin shipped with ~11-12 min mixes and convert worse — short mixes loop ~5x over 1 hour = audibly repetitive.

Drop tracks into `music/<slug>/01-name.mp3`, `02-...`, etc. `make-longform.js` reads everything in the folder.

---

## Flow 3: Long-form render — `make-longform.js`

```bash
node make-longform.js <slug>        # one theme
node make-longform.js all           # every theme in themes.js
```

What it does:
1. Reads theme from `themes.js`
2. Concatenates ALL mp3s in `music/<slug>/`, loops until 1 hour
3. **loudnorm to -18 LUFS** (ambient/sleep right), 5s audio fade out
4. Image looped at 1fps (keeps file ~150MB)
5. Output: `renders/<slug>.mp4`

Render takes ~10 min on Jake's machine. The script accepts `all` to batch — useful for re-rendering after a music swap.

---

## Flow 4: Short render — `make-short.js`

```bash
node make-short.js <slug>
node make-short.js all
```

What it does:
1. Scales landscape image to 1080x1920 with **breathing pan** (sin-driven, loop-seamless)
2. Adds cinematic grade (warm) + vignette + drawbox bars
3. "REALM BLENDER" watermark bottom-right
4. **Text timeline (10s format):**
   - `0-4s`: HOOK = `theme.location` (instant, beats the 3s scroll gate)
   - `5.5-9.5s`: CTA = rotated from `CTA_POOL` (8 variants, hashed from slug for stability)
   - `9.5-10s`: clean (so loop seam has no text — rewatches count)
5. Auto-detects loudest 10s of music, starts there (skips ambient intro)
6. Output: `shorts/<slug>-short.mp4` (~5MB)

**CTA pool** (rotates per slug, deterministic):
1. SUB TO SUPPORT / A SMALL CHANNEL
2. SUPPORT A / SMALL CREATOR
3. HELP US GROW / HIT SUBSCRIBE
4. SUB IF YOU / WANT MORE OF THIS
5. SMALL CHANNEL / BIG DREAMS — SUB
6. ENJOYING THIS? / SUB TO HELP
7. LITTLE CHANNEL / NEEDS YOUR SUB
8. NEW HERE? / SUBSCRIBE TO STAY

Per-theme override: set `shortCta: ['LINE1', 'LINE2']` in `themes.js` for the slug.

---

## Flow 5: Thumbnail render — `make-rb-thumbnails.js`

```bash
node make-rb-thumbnails.js <slug>
node make-rb-thumbnails.js all
```

Style (May 27 redesign — channel CTR went from 1.44% to ~target 3-5%):
- 1280x720 JPG (under YouTube's 2MB cap)
- **Big bold sans-serif top word** in white with thick black stroke
- **Smaller yellow accent below** ("× LOCATION") for franchise mashups
- Bottom-half darkening gradient so text always pops
- Auto-fit shrinks long titles so nothing clips
- Font: Montserrat-ExtraBold (only font on disk)

Output: `thumbnails/<slug>.jpg`.

For the cottagecore (non-IP) themes like `cozy-cabin-snow`, the thumbnail just uses the single word without the yellow accent — cleaner.

---

## Flow 6: Bulk re-deploy thumbnails — `apply-thumbnails.js`

```bash
node apply-thumbnails.js              # dry-run, lists what it would do
node apply-thumbnails.js --go         # actually pushes
```

Matches local thumbnails to live videos by signature-word map, sorts by impressions (highest leverage first). YouTube's official limit is ~6 thumbnail changes per day; in practice 23+ ran in a single batch on May 27 without issue.

---

## Flow 7: Upload pair — `upload-pair.js`

```bash
node upload-pair.js <slug>
```

The daily driver. In one command:
1. Uploads long-form (categoryId=10, with thumbnail, public)
2. Waits 30s
3. Uploads Short (categoryId=10, public)
4. Sets thumbnail on long-form
5. Posts a comment on the Short (you still pin it manually in Studio)
6. Adds both to playlists

Reads COPY object from inside the script — every slug needs a COPY entry with `place`, `shTitle`, `shHook`, `lfStory`, `lfTags`, `shTags`, `hashtags`. The story follows the channel's signature `"You opened the wrong door... You breathe. You stay."` voice (with variations for non-Hogwarts themes).

---

## Flow 8: Index refresh — `build-upload-index.js`

```bash
node build-upload-index.js
```

Writes `uploader/upload-index.json` — the definitive slug → `{longId, shortId}` map.

**Source of truth (Jun 7 fix):** uses the UNION of `playlistItems.list` + `search.list({forMine: true})`. The bare playlist endpoint silently drops Shorts (confirmed: Batcave Short was missing from `playlistItems` but present via `videos.list`). Don't trust just the uploads playlist.

Run after every upload to keep the index fresh. The script also reports any duplicate matches (multiple channel videos hitting the same slug).

---

## Flow 9: Analytics — `analytics-report.js`

```bash
node analytics-report.js
```

Pulls a 28-day report: channel totals, traffic sources, device type, per-video AVP%, geography, daily trend.

For deeper slicing also see:
- `traffic-per-video.js` — per-video traffic source breakdown
- `subs-report.js` — sub gain/loss by video

**Key metric to watch: AVP% (averageViewPercentage).** Under 5% = bounce problem (hook/thumbnail). 15%+ = healthy for ambient. The channel was at 9.87% on May 15; the photoreal Shorts (Prague 79%, Edinburgh 69%, Jedi 85%) push that up.

---

## What still requires manual YouTube Studio work

- **Pinning comments** — API can't pin, must click in Studio
- **Reordering homepage channel sections**
- **Verifying channel trailer is a Short** (not a long-form)
- **Strikes / Content ID claims** — when YouTube auto-removes a video (Paris's first long-form), the rejection reason is only visible in Studio Content tab
- **Membership / monetization settings** (when applicable)

---

## Setup on a new machine

```bash
git clone https://github.com/<you>/realm-blender.git
cd realm-blender/uploader
npm install

# Copy these from your other machine (NOT in git):
#   uploader/client_secret.json   (from Google Cloud Console OAuth credentials)
#   uploader/token.json           (or run auth flow first time to regenerate)

# Verify:
node -e "const {THEMES} = require('./themes'); console.log('themes loaded:', Object.keys(THEMES).length)"
```

Raw assets (`images/`, `music/`, `renders/`, `shorts/`) are gitignored. Either:
- Copy them from your home machine, or
- Regenerate from prompts (see `asset-prompts.md`)

The repo on its own only ships the code + thumbnails + fonts + docs.
