# Realm Blender

YouTube ambient/study channel ([@realmblender](https://youtube.com/@realmblender)) — mashup fictional locations with real businesses ("A Coffee Shop in Mordor", "Hogwarts in Tokyo at 3AM").

**Channel ID:** `UCcEeW-W_HSW4_eHrW0d7XDA` · **Category:** Music (10) · **Google Cloud project:** `realm-blender`

## What's here

```
realm-blender/
├── images/             # 1 scene image per theme (2720x1536 PNG)
├── music/<slug>/       # 1+ Suno tracks per theme (mp3)
├── renders/            # 1hr long-form mp4s (output of make-longform.js)
├── shorts/             # 10s vertical mp4s (output of make-short.js)
├── thumbnails/         # 1280x720 JPGs (output of make-rb-thumbnails.js)
├── uploader/           # all scripts — see below
└── docs/               # workflow.md, asset-prompts.md, growth-strategy
```

## The 12 active scripts

Everything below in `uploader/`. Anything not listed here is stale (see "Stale scripts" section).

| Script | What it does |
|---|---|
| `themes.js` | THE source of truth for every theme (39 entries). Read by every generator. |
| `auth.js` | Google OAuth flow + token refresh |
| `upload.js` | Core `uploadVideo()` primitive — used by everything |
| `make-longform.js <slug\|all>` | Image + music → 1hr ambient mp4 → `renders/<slug>.mp4` |
| `make-short.js <slug\|all>` | Image + music → 10s vertical Short with rotating CTA → `shorts/<slug>-short.mp4` |
| `make-rb-thumbnails.js <slug\|all>` | Bold-text thumbnail (May 27 redesign) → `thumbnails/<slug>.jpg` |
| `apply-thumbnails.js [--go]` | Bulk-push thumbnails to LIVE videos |
| `upload-pair.js <slug>` | Daily driver — uploads long + Short + thumbnail + comment + playlists |
| `build-upload-index.js` | Channel ↔ slug map. Uses `playlistItems` + `search.list` UNION for accuracy. |
| `analytics-report.js` | Channel-wide stats (28d window) |
| `traffic-per-video.js` | Per-video traffic source breakdown |
| `subs-report.js` | Sub gain/loss attribution |

## Workflow (per theme)

```
1. Drop image into images/<slug>.png  (Kling, Midjourney — see docs/asset-prompts.md)
2. Drop music into music/<slug>/*.mp3 (Suno — see docs/asset-prompts.md)
3. Add slug entry to uploader/themes.js
4. Add COPY entry to uploader/upload-pair.js
5. node uploader/make-longform.js <slug>     # ~10 min render
6. node uploader/make-short.js <slug>        # ~30 sec render
7. node uploader/make-rb-thumbnails.js <slug>
8. node uploader/upload-pair.js <slug>       # uploads everything
9. node uploader/build-upload-index.js       # refresh the index
```

## Key facts

- **All uploads use categoryId `10` (Music)** — never use 22 (People & Blogs)
- **Shorts are 10 seconds** (changed May 28 from 20s — completion rates jumped)
- **No weather overlays in Shorts** (stripped May 28 — Jake judged them weak)
- **Thumbnails are bold sans-serif text** on the scene (new style as of May 27)
- **Short CTAs rotate** from a pool of 8 small-creator sub-asks (added Jun 2 — kills "every Short ends identical" perception)
- **Channel ID is hardcoded** in scripts: `UCcEeW-W_HSW4_eHrW0d7XDA`

## Setup (new machine)

```bash
cd uploader
npm install
# Drop client_secret.json from Google Cloud Console into uploader/
node auth.js   # first run opens browser to authorize
```

`client_secret.json` and `token.json` are gitignored — get them from your Google Cloud project or re-auth.

## Docs

- `docs/workflow.md` — long-form how-to walkthrough
- `docs/asset-prompts.md` — Suno + Kling/Midjourney prompt formulas
- `docs/growth-strategy-2026.md` — May 15 research-backed strategy

## Stale scripts

The `uploader/` directory also contains ~20 one-off scripts from May 14-17 (initial channel cleanup, retitling campaigns, gap-fills). They're not used by any current workflow. Safe to ignore — they're kept for git history but should not be referenced.

## License

Personal project. Not open source.
