# Realm Blender — Asset Prompt Playbook

*Last refreshed: June 8, 2026. Added photoreal Kling recipe + longer-tracks Suno recipe.*

Reusable prompt formulas for generating **Suno** (music) and **Kling** (image)
assets. Every theme = one image + 2-3 music tracks; the long-form uses all
tracks, the Short derives from the same files. Don't reinvent these each time —
copy a formula, swap the theme.

---

## The niche (keep every prompt on-brand)

Realm Blender = **a huge recognizable fictional realm + a cozy everyday corner of it**,
turned into a 1-hour ambient world. The breakout video (Hogwarts × Tokyo, **1,006 views
as of June 2026**, 4 net subs) suggests **two-world fusions** ("Realm A meets Realm B")
outperform single settings — favor fusions.

**Cozy/library/candlelit themes have the best sub conversion** (Castle Black Spa 9.1%,
Winterfell Piano Bar 2.9%, Snowy Kyoto 2.4%). Avoid gritty mashups (Death Star
Laundromat, Wakanda Barbershop) — they get views but zero subs.

**Audience confirmed 52% female, 35-44 dominant.** Photoreal scenes with cozy
interiors + cool exteriors visible through a window (the Paris/Edinburgh/Prague
formula) are the current direction.

---

## 🎵 SUNO — Music Prompt Formula

Write it as a **scene-as-vignette**: a vivid little story describing the place,
ending with a wink. NOT a dry tag list.

**Structure:**
1. **The fusion / setting** — name both worlds being blended
2. **Specific instruments with character** — give each a simile ("a warm cello
   holding a long low note like a sleeping dragon")
3. **Atmosphere / foley** — ambient sounds, reverb, the room ("hearth crackle,
   wind against paper windows")
4. **The wink ending** — "like [character] did [mundane cozy thing] and stayed
   for the vibe"

**Reference prompt (Batcave Pizza — the proven style):**
> Late night underground jazz club meets pizza joint, deep walking double bass
> line, muted trumpet playing a lonely melody that echoes off cave walls,
> distant dripping water reverb, smoky noir atmosphere, like Batman ordered a
> margherita and stayed for the vibe

**Rules:**
- Instrumental only — make sure lyrics are OFF
- Calm / slow / ambient, minimal or no drums
- Loudness is handled automatically by the generators (loudnorm to -18 LUFS) —
  no manual volume tweaking. -18 is gentler than YouTube's -14 default, right
  for an ambient/sleep channel.
- Generate long, or generate a loop to extend (long-form ≈ 1 hour, Short uses first 20s)

---

## 🎬 KLING — Image Prompt Formula

Must be **photorealistic / cinematic**, NOT painterly/anime.

### ⚡ THE #1 RULE — lead with the ICONIC, GRAND element (swipe-stopper)

Data finding (Hogwarts Tokyo, 1,009 views vs Kyoto/Venice ~45 each): the ONLY
real difference was the **first frame**. 976 of Tokyo's views came from the
Shorts swipe feed — viewers decide in ~0.2s whether to stop. Tokyo opened on
the **grand, instantly-recognizable Hogwarts Great Hall** (house banners,
rows of floating candles, dramatic scale). Kyoto/Venice opened on a quiet dim
cozy corner — nothing made the thumb stop.

So the image MUST contain a **grand, instantly-recognizable hero element** of
the realm — the Great Hall, the castle itself, towering iconic architecture —
NOT just a cozy nook. The cozy desk/tea detail is secondary. And since
make-short.js pans LEFT→RIGHT starting at the left, put the **iconic hero
element on the LEFT side** so the Short opens on the swipe-stopper.

**Structure:**
1. **"Photorealistic cinematic shot"** up front
2. **The ICONIC HERO element, on the LEFT** — grand, recognizable, dramatic
   scale (Great Hall, castle spires, towering arches + banners + candles)
3. **The fusion** — the real-world setting blended in (right side / through windows)
4. **A cozy focal detail** — the everyday corner (desk, tea, books) — secondary
5. **Light + mood** — warm interior vs. cool exterior, time of day
6. **Camera language** — "35mm lens, shallow depth of field, 8k, realistic
   textures, cinematic color grading"
7. **Always end:** "Wide horizontal composition. No people, no text."
   (wide = make-short.js pans across it; no text/people keeps it clean)

---

## Worked example — Hogwarts × Kyoto

Theme id: `hogwarts-kyoto` — snowy temple-magic fusion.

### Suno
> Snowed-in wizarding temple where Hogwarts meets old Kyoto, slow fingerpicked
> koto laced with soft grand piano, a warm cello holding a long low note like a
> sleeping dragon, gentle music-box chimes drifting like falling snow, faint
> crackle of a hearth and wind against paper windows, hushed candlelit reverb
> off ancient stone, like a student stayed late in the library, conjured a cup
> of tea, and watched the snow fall till dawn

Title: `Snowfall Over the Wizarding Temple`

### Kling
> Photorealistic cinematic shot. A snowy fusion of an ancient Hogwarts-style
> stone wizarding hall and a traditional Kyoto temple — weathered stone arches
> meeting wooden pagoda rooftops heavy with fresh snow. Warm glowing paper
> lanterns and floating candles light a cozy interior study nook: an aged wooden
> desk with old leather spellbooks, a steaming ceramic cup of tea, a wand
> resting beside it. Tall arched windows with soft snowfall drifting past,
> frosted bare cherry trees outside in cold blue twilight. Warm golden interior
> light against cool exterior. Shot on a 35mm lens, shallow depth of field, soft
> natural lighting, ultra-detailed, 8k, realistic textures, cinematic color
> grading. Wide horizontal composition. No people, no text.

### Short on-screen copy
NOTE: NO "POV:" prefix — the opening line is just the location.
Long lines auto-wrap to 2 lines; colons are escaped automatically — all handled
inside `make-short.js`. You only set location / vibe / question in `themes.js`.

| Beat | Text |
|------|------|
| Open (0–3s) | `HOGWARTS IN SNOWY KYOTO` |
| Vibe (3–8s) | `SNOWFALL. LANTERNS. OLD MAGIC.` |
| Question (8–13s) | `WOULD YOU STUDY HERE?` |
| CTA (15–20s) | `1 HOUR TO STUDY OR SLEEP` / `ON OUR CHANNEL` |

---

## The three generators (the ONLY ones — do not make more)

`make-longform.js`, `make-short.js`, `make-thumbnail.js` are the permanent
generators. All read theme config from `uploader/themes.js` (define each theme
ONCE there). Everything we learned is already baked in — never re-specify it.

```
node make-longform.js  <theme-id|all>   # 1-hour video, ALL tracks, loudnorm -18 LUFS, 5s fade-out
node make-short.js     <theme-id|all>   # 20s Short, funnel format, loudnorm -18 LUFS, fades, auto-wrap
node make-thumbnail.js <theme-id|all>   # 1280x720 thumbnail, Bebas Neue, yellow, echo
```

Baked into make-short.js: no "POV:" prefix, auto-wrap long lines, escape ':',
auto-detect loud music start, audio fade in/out, seamless video loop.
Baked into make-longform.js: uses every mp3 in `music/<id>/`, loudnorm, 5s fade-out.
Baked into make-thumbnail.js: "Place × Business" text from themes.js `thumb`
field, written via `textfile=` so apostrophes/colons never break the render.

Outputs: Short -> `shorts/<id>-short.mp4`,  long-form -> `renders/<id>.mp4`.

Any test/experiment scripts are throwaway — never make them the permanent flow.

## Workflow after generating

This is the WHOLE flow. Jake generates assets; the 4 steps below are the job:

1. Jake drops ALL files in `Downloads/` — the image plus EVERY music track/take.
2. **MOVE** (cut, not copy) from Downloads → `images/<theme-id>.png` and
   ALL tracks → `music/<theme-id>/`. Downloads is left clean afterward.
3. Add the theme to `THEMES` in `uploader/themes.js` (location, vibe, question).
4. Generate all three:
   - `node make-longform.js <theme-id>`  — the 1-hour video
   - `node make-short.js <theme-id>`     — the 20s Short
   - `node make-thumbnail.js <theme-id>` — the 1280x720 thumbnail
5. Short and long-form share the same image/music → guaranteed consistent funnel
6. **Upload**: long-form FIRST (so the Short can link to it). The upload script
   attaches `thumbnails/<theme-id>.jpg` to the long-form — ALWAYS generate the
   thumbnail before uploading, and pass `thumbnailPath` to `uploadVideo()`.

---

## SHORTS GOAL: SUBSCRIBERS (locked May 2026)

The goal is the SUB COUNT moving — not a long-form funnel. Every Short asks
directly for the subscribe. `uploader/upload-pair.js` bakes this in:

1. **On-screen CTA** (in make-short.js): `SUBSCRIBE FOR / A NEW REALM DAILY`
   — a direct, reason-based sub ask. A reason ("a new realm daily") beats
   bare "Subscribe". Only honest if posting is actually near-daily.
2. **Short description** — opens with the hook line, then `🔔 SUBSCRIBE for a
   new realm every day...`. Long-form link is included lower down as a
   secondary option, not the headline.
3. **Posted comment** — engagement question + sub nudge. Pin it in Studio.

Upload long-form FIRST (the Short still links to it). `upload-pair.js` prints
the one manual step (pin the comment) at the end.

## LONG-FORM TITLE FORMULA (locked — A/B tested winner)

A YouTube A/B title test on "Moonlit Lake" (ran May 8–11, 2026) had a clear
winner — **66.7% watch-time share vs 20.6% and 12.7%**. Use this formula for
ALL future long-form uploads:

```
<Place Name> | 1 Hour Calm Focus Music | Relax, Study, Sleep
```

What the test proved:
- **Lead with the literal place name** — clean, searchable. Beat poetic phrasing.
- **"Calm Focus Music"** beat both "Deep Focus Music" and "Ambient Music".
- **List the 3 use-cases** — "Relax, Study, Sleep" — covers every click reason.
- Literal + functional beats poetic/vague every time.

Examples:
- `Snowy Kyoto Wizarding Library | 1 Hour Calm Focus Music | Relax, Study, Sleep`
- `Venice Canals Wizarding Library | 1 Hour Calm Focus Music | Relax, Study, Sleep`

Short titles: keep the `POV: ... #Shorts` style (POV is fine in the TITLE).

---

## DESCRIPTION FORMAT (locked — unified May 2026)

ALL long-form descriptions follow ONE immersive structure. Never write ad-hoc.

**Fictional themes** — open with `You opened the wrong door.`:
```
You opened the wrong door.

[2-3 short paragraphs: the iconic place is still there ("The X still Y...")
 — THEN someone opened a cozy [business] inside it. Put the viewer IN it.]

You [take a seat]. You breathe. You stay.

Perfect for studying, deep focus, sleep, or relaxation.

Subscribe for more fantasy x real life ambient worlds.

#Ambient #StudyMusic #<IP> #<Place> #<Business> #Fantasy #LoFi #StudyWithMe #DarkAcademia #SleepMusic
```

**Nature themes** — open with `You found this place for a reason.`:
```
You found this place for a reason.

[2 short paragraphs: the calm nature scene. End "The night is quiet, and it is yours."]

Let the [lake/forest/ocean] hold you a while.

Perfect for studying, deep focus, sleep, or relaxation.

Subscribe for more calm ambient worlds.

#Ambient #StudyMusic #Nature #<Theme> #CalmMusic #SleepMusic #LoFi #StudyWithMe #Relaxing #FocusMusic
```

**Short descriptions** (already consistent — keep this):
```
[hook line — vibe + question]

Full 1-hour ambient version: https://youtube.com/watch?v=<LONGFORM_ID>

Fantasy x Real Life mashups every day   (nature: "Calm ambient worlds every day")

#Shorts #Ambient #StudyMusic #<tags>
```

---

## 🆕 PHOTOREAL RECIPE (added June 2026)

The painterly Ghibli-style look was the channel's identity through May. June pivot:
**photoreal** images perform better (Prague/Edinburgh/Cabin all pulled higher views
than painterly Paris/Rome). Use this recipe for all new themes unless you have a
specific reason to go painterly.

### Photoreal Kling prompt template

```
Photorealistic interior of [a wizarding library / cozy mountain cabin / etc.] at night, warm amber lamplight, dark walnut bookshelves filled with worn leather books, a real wooden desk in the foreground with an open hardcover book, brass desk lamp, a real wax candle in a holder beside it. Tall arched window in the back wall. Through the window: [city / weather / landscape]. Cozy warm interior, cool [color] outside. Cinematic photograph, 35mm film, shallow depth of field on the desk in the foreground, soft natural light. Looks like a real photograph, NOT an illustration. No floating objects, no magical effects, no people, realistic proportions, believable space. 16:9 widescreen, ultra-detailed.
```

**Midjourney flags:** `--ar 16:9 --v 6 --style raw --s 50`

**Negative prompt:** `cartoon, illustration, anime, painting, drawing, fantasy artwork, floating candles, magical effects, people, figures`

**Critical phrases that fight the AI-art look:**
- "**Photorealistic**" up front
- "**Cinematic photograph, 35mm film**"
- "**Looks like a real photograph, NOT an illustration**"
- "**No floating objects, no magical effects**"
- "**Realistic proportions, believable space**"
- `--s 50` (low stylization) — KEY flag, fights the painterly default

---

## 🆕 LONGER-TRACKS SUNO RECIPE (added June 2026)

Short Suno tracks (1-2 min) loop ~5x over a 1-hour long-form = audibly repetitive.
**Top sub-converters all have 15-28 min total music libraries.** Use this recipe
going forward.

### Suno prompt template (slower, longer)

```
Cozy lo-fi study music, slow ambient piano with soft music box notes, warm and [theme-flavor]. Late-night [setting], gentle [weather] ambience. No drums, no percussion, no vocals. Calm, continuous, loopable. Tempo 50-55 BPM. Slow contemplative pacing with long sustained phrases, gradually evolving textures, extended introspective sections.

Length: at least 4 minutes, slow build, no abrupt endings.
```

**Critical phrases that nudge Suno toward longer output:**
- **Tempo 50-55 BPM** (was 55-60 — slower = longer phrases)
- **"long sustained phrases, gradually evolving textures, extended introspective sections"**
- **"Length: at least 4 minutes, slow build, no abrupt endings"**

### The Extend workflow (THE reliable way to get 4+ min tracks)

Prompts alone don't guarantee long output. The real path:
1. Generate 2-3 times with the prompt → 4-6 base tracks (~2 min each)
2. Pick the 2-3 best
3. **Click Suno's "Extend" button on each** → adds ~2 more min
4. Optionally Extend again for 6 min tracks
5. End state: 2-3 tracks × 4-6 min = **15-18 min total library**

### Mix-length targets

| Theme | Total mix | Conv % | Notes |
|---|---:|---:|---|
| Chamber Nightclub | 28 min | top-2 | best mix on channel |
| King's Landing Jazz | 21 min | 2.4% | top short |
| Winterfell Piano Bar | 18 min | 2.9% | top long-form converter |
| Castle Black Spa | 20 min | **9.1%** | highest conv rate |
| **Target floor** | **15 min** | — | use Extend to hit this |
| Paris / Rome / Cabin | 11-12 min | 0% | too short — known weakness |
