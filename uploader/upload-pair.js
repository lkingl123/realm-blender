// upload-pair.js — THE reusable uploader for a Realm Blender theme pair.
//
//   node upload-pair.js <theme-id>
//
// Uploads long-form FIRST, then the Short. Funnel-optimized (2026 research):
//   - Short description: long-form LINK ON LINE 1 (matches the "LINK IN
//     DESCRIPTION" on-screen CTA — viewers look there first).
//   - Short comment: link + engagement question (posted; pin it in Studio).
//   - Long-form description: immersive format, confirms the Short's promise.
//   - Thumbnail attached, both added to playlists, Music category.
//
// MANUAL STEP after running (the #1 funnel lever the API cannot do):
//   In YouTube Studio open the Short -> "Related video" -> select the long-form.
//   This puts a clickable link inside the Short that stays visible throughout.

const { uploadVideo } = require('./upload');
const { authenticate } = require('./auth');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { THEMES } = require('./themes');

// per-theme upload copy. Add an entry before uploading a new theme.
// `place` = the long-form title's leading place name (winning A/B formula).
// `lfStory` = the immersive long-form description body (no tail/tags — added).
// `lfHours` = 1 or 2.  `lfTags`/`shTags` = tag arrays.  `shHook` = Short hook line.
const COPY = {
  'hogwarts-london': {
    place: 'Rainy London Wizarding Library', lfHours: 1,
    shTitle: 'POV: A Wizarding Library in Rainy London #Shorts',
    shHook: 'Rain, lanterns, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, London is dark and raining. Red phone boxes glow on the corner. Big Ben stands faint in the mist.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','london','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','london','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #London #Fantasy',
  },
  'hogwarts-newyork': {
    place: 'Rainy New York Wizarding Library', lfHours: 1,
    shTitle: 'POV: A Wizarding Library in Rainy New York #Shorts',
    shHook: 'Rain, city lights, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, New York is dark and raining. Yellow cabs glide down the wet street. Brownstone stoops glisten under the lamplight.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','new york','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','new york','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #NewYork #Fantasy',
  },
  'hogwarts-paris': {
    place: 'Rainy Paris Wizarding Library', lfHours: 1,
    shTitle: 'POV: A Wizarding Library in Rainy Paris #Shorts',
    shHook: 'Rain, Eiffel Tower, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, Paris is dark and raining. The Eiffel Tower glows warm gold across the wet rooftops. Haussmann facades line the cobblestone street below, lamplight pooling in the puddles.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','paris','eiffel tower','rainy ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','paris','eiffel tower','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #Paris #Fantasy',
  },
  'hogwarts-rome': {
    place: 'Golden Rome Wizarding Library', lfHours: 1,
    shTitle: 'POV: A Wizarding Library in Golden Rome #Shorts',
    shHook: 'Sunset, the Colosseum, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, Rome is gold and quiet. The Colosseum glows amber against the setting sun, ancient terracotta rooftops stretching to the horizon. Cypress trees stand dark on the hillsides, lanterns lit along the cobblestone street below.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','rome','colosseum','italy ambient','sunset ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','rome','colosseum','italy','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #Rome #Fantasy',
  },
  'hogwarts-prague': {
    place: 'Snowy Prague Wizarding Library', lfHours: 1,
    shTitle: 'POV: A Wizarding Library in Snowy Prague #Shorts',
    shHook: 'Snow, gothic spires, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, Prague is quiet and snowed-in. The gothic spires of Týn Church and Prague Castle rise sharp against the indigo dusk, terracotta rooftops dusted with fresh snow. Gas lamps glow amber along the cobblestone street below, the Vltava river faint through the gentle snowfall.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','prague','czech republic','gothic ambient','snow ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','prague','czech','gothic','snow','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #Prague #Fantasy',
  },
  'hogwarts-edinburgh': {
    place: 'Misty Edinburgh Wizarding Library', lfHours: 1,
    shTitle: 'POV: A Wizarding Library in Misty Edinburgh #Shorts',
    shHook: 'Mist, castle rock, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, Edinburgh is dim and misty. The gothic spires of the Old Town rise from the haze, Edinburgh Castle faint on its volcanic rock in the distance. Gas lamps glow amber along the cobblestone closes below, low mist drifting between the dark stone buildings.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','edinburgh','scotland','gothic ambient','foggy ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','edinburgh','scotland','gothic','mist','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #Edinburgh #Fantasy',
  },
  'cozy-cabin-snow': {
    place: 'Cozy Snowed-In Mountain Cabin', lfHours: 1,
    shTitle: 'POV: A Snowed-In Cabin by the Fire #Shorts',
    shHook: 'Snow, fire, a quiet book. Would you sleep here?',
    lfStory: `The snow has been falling for hours, and the cabin is yours.

The fire crackles low in the stone hearth. A knit blanket waits on the worn leather chair. There's a steaming mug of tea on the side table, an open book beside it. A brass lantern glows soft on the windowsill.

Outside, the mountains are quiet. Snow drifts past the dark pines, the world muffled and white. No road, no neighbors. Just the storm, the fire, and you.

You settle in. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','cozy cabin','cottagecore','deep focus','fireplace ambient','focus music','mountain cabin','realm blender','relaxing','sleep music','snowfall ambient','snowy night','study music','study with me','winter ambient'],
    shTags: ['aesthetic','ambient','ambient shorts','asmr','cozy','cozy cabin','cottagecore','fireplace','lo-fi','lofi shorts','mountain cabin','pov','realm blender','relaxing','shorts','sleep aesthetic','snowfall','study music','study with me','winter'],
    hashtags: '#CozyCabin #Snowfall #Fireplace #SleepMusic',
  },
  'diagon-alley-birdshop': {
    place: 'Diagon Alley Bird Shop', lfHours: 1,
    shTitle: 'POV: A Bird Shop in Diagon Alley #Shorts',
    shHook: 'Rain, feathers, old magic. Which bird do you pick?',
    lfStory: `You opened the wrong door.

The cobblestones still wind crooked between the leaning shops. Rain still patters on the glass. The signs still creak in the wind.

But this little shop is full of owls and ravens, perched in the warm lamplight, feathers ruffling softly. A cup of tea steams on the counter. Spellbooks rest beside the cages.

You step in out of the rain. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','diagon alley','hogwarts','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','diagon alley','hogwarts','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #DiagonAlley #Fantasy #Owls',
  },
  'hogwarts-shanghai': {
    place: 'Old Shanghai Wizarding Library', lfHours: 1,
    shTitle: 'POV: A Wizarding Library in Old Shanghai #Shorts',
    shHook: 'Rain, neon, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, Old Shanghai breathes in the rain. Red paper lanterns sway over the wet street. Neon signs glow soft through the mist, art-deco facades of the Bund hazy in the distance.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','shanghai','old shanghai','china ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','shanghai','china','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #Shanghai #Fantasy',
  },
  'hogwarts-vegas': {
    place: 'Las Vegas Wizarding Library at Midnight', lfHours: 1,
    shTitle: 'POV: A Wizarding Library in Las Vegas at Midnight #Shorts',
    shHook: 'Neon, desert night, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, the Las Vegas Strip glows in the desert night. Neon marquees shimmer across the sand. The city hums far below, awake long past midnight.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','las vegas','vegas','neon ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','las vegas','vegas','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #LasVegas #Fantasy',
  },
  'hogwarts-express-tattoo': {
    place: 'Hogwarts Express Tattoo Parlor', lfHours: 1,
    shTitle: 'POV: A Tattoo Parlor on the Hogwarts Express #Shorts',
    shHook: 'Steam, ink, old magic. What would you get?',
    lfStory: `You opened the wrong door.

The train still rolls slow through the highlands. Steam still drifts past the windows. The brass lamps still sway with the rhythm of the tracks.

But this car has been turned over to a tattoo parlor — a leather chair under a warm pendant light, ink in glass bottles, sketchbooks of magical sigils stacked on the side table. The autoclave hums quietly in the corner.

Outside, the Scottish hills slide past in the late afternoon gold.

You settle into the chair. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','hogwarts express','tattoo','train ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','hogwarts express','tattoo','train','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #HogwartsExpress #Tattoo #Fantasy',
  },
  'hogwarts-aurora': {
    place: 'Wizarding Library Under the Northern Lights', lfHours: 1,
    shTitle: 'POV: A Wizarding Library Under the Northern Lights #Shorts',
    shHook: 'Aurora, snow, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, the Northern Lights ripple green and violet across the arctic night. Snow blankets the pines below. A frozen lake mirrors the glowing sky.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','northern lights','aurora','snow ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','northern lights','aurora','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #NorthernLights #Fantasy',
  },
  'hogwarts-egypt': {
    place: 'Wizarding Library by the Pyramids', lfHours: 1,
    shTitle: 'POV: A Wizarding Library by the Pyramids #Shorts',
    shHook: 'Golden sands, old magic. Would you study here?',
    lfStory: `You opened the wrong door.

The stone arches still climb into shadow. The candles still drift, unlit by any hand. Old spellbooks still wait on the shelves.

But outside the tall windows, the Great Pyramids of Egypt glow in the golden desert dusk. Palm trees sway over the warm sand. The Sphinx keeps watch across the dunes.

You set down your quill. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','egypt','pyramids','desert ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','egypt','pyramids','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #Hogwarts #Egypt #Fantasy',
  },
  'gotham-diner': {
    place: 'Late-Night Gotham Diner', lfHours: 1,
    shTitle: 'POV: A Late-Night Diner in Gotham #Shorts',
    shHook: 'Rain, neon, black coffee. What are you ordering?',
    lfStory: `It's past midnight, and the rain hasn't stopped.

The diner glows warm against the dark. Neon hums in the window. Steam curls off a fresh pot of coffee, and the booths sit quiet and empty.

Outside, Gotham is wet and electric — headlights smearing across the glass, a city that never quite sleeps.

You slide into a booth. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','gotham','batman ambient','rainy ambient','diner','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','gotham','batman','diner','lo-fi','lofi shorts','pov','rain','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#Gotham #Batman #Rain #Fantasy',
  },
  'winterfell-piano-bar': {
    place: 'Winterfell Piano Bar', lfHours: 1,
    shTitle: 'POV: A Piano Bar in Winterfell #Shorts',
    shHook: 'Snow, candlelight, slow keys. Would you stay the night?',
    lfStory: `The fires are burning low, and the snow hasn't stopped.

The great hall sits quiet — Stark banners hanging from the rafters, candles guttering on the long tables, a slow piano playing softly in the corner. Furs are folded on the benches. The fireplaces crackle.

Outside, Winterfell is buried in snow, the godswood dark and still beyond the windows.

You settle into a fur-lined seat by the fire. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','game of thrones ambient','winterfell','piano','snow ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','game of thrones','winterfell','piano','snow','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#GameOfThrones #Winterfell #Piano #Snow',
  },
  'kings-landing-jazz': {
    place: "King's Landing Jazz Bar", lfHours: 1,
    shTitle: "POV: A Jazz Bar in King's Landing #Shorts",
    shHook: 'Smoke, strings, candlelight. Would you stay late?',
    lfStory: `The last set is winding down, and the rain hasn't stopped.

Candles gutter low on the tables. Smoke drifts in the warm lamplight. A slow upright bass and soft piano fill the room, and the booths sit quiet and half-empty.

Outside the tall windows, King's Landing glistens in the rain — torchlight on wet stone, the Red Keep faint against the dark.

You settle into a corner booth. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','game of thrones ambient','kings landing','jazz','rainy ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','game of thrones','kings landing','jazz','lo-fi','lofi shorts','pov','rain','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#GameOfThrones #KingsLanding #Jazz #Fantasy',
  },
  'wakanda-barbershop': {
    place: 'Wakanda Barbershop', lfHours: 1,
    shTitle: 'POV: A Barbershop in Wakanda #Shorts',
    shHook: 'Vibranium fade, quiet city. Rate this cut 1 to 10.',
    lfStory: `The shop is calm tonight, and the city outside is glowing.

Clippers hum soft. The leather chair waits, mirror lit warm in the lamplight. Faded photos and vibranium tools rest along the counter, and the radio plays low.

Outside the open shutters, Wakanda's skyline shimmers — golden lights woven through the trees, hover-craft drifting silent in the distance.

You take the seat. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','focus music','wakanda ambient','black panther ambient','marvel ambient','wakanda','barbershop','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','fantasy mashup','wakanda','black panther','marvel','barbershop','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#Wakanda #BlackPanther #Marvel #Barbershop',
  },
  'chamber-nightclub': {
    place: 'Chamber of Secrets Nightclub', lfHours: 1,
    shTitle: 'POV: A Nightclub in the Chamber of Secrets #Shorts',
    shHook: 'Neon, serpents, slow bass. Would you dance here?',
    lfStory: `You opened the wrong door.

The great stone serpents still coil along the walls. The pillars still climb into the dark. The water still pools across the floor, dead-still and black.

But tonight the chamber is alive — neon green light washing the stonework, a slow bass thrumming through the columns, smoke drifting low across the water.

You step in from the dark. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','harry potter ambient','hogwarts','chamber of secrets','nightclub','dark ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','harry potter','hogwarts','chamber of secrets','nightclub','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#HarryPotter #ChamberOfSecrets #Nightclub #Fantasy',
  },
  'dagobah-bookstore': {
    place: 'Dagobah Bookstore', lfHours: 1,
    shTitle: 'POV: A Bookstore on Dagobah #Shorts',
    shHook: 'Mist, pages, stillness. What would you read?',
    lfStory: `The swamp is quiet tonight, and the mist hasn't lifted.

Lanterns glow soft between the gnarled roots. Old hardback spines lean on shelves carved from the trees themselves. A kettle whistles low somewhere out of sight.

Outside the windows, Dagobah breathes in the dark — mist drifting through the hanging vines, fireflies pulsing slow in the deep green.

You take a book off the shelf. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','focus music','star wars ambient','dagobah','yoda','jungle ambient','swamp ambient','bookstore','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy mashup','star wars','dagobah','bookstore','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#StarWars #Dagobah #Bookstore #Cozy',
  },
  'deathstar-laundromat': {
    place: 'Death Star Laundromat', lfHours: 1,
    shTitle: 'POV: A Laundromat on the Death Star #Shorts',
    shHook: 'Spin cycle, deep space, fluorescent calm. Would you do laundry here?',
    lfStory: `It's late shift, and the corridor is quiet.

The dryers hum in a slow row. Fluorescent tubes buzz overhead, washing everything pale grey. A magazine sits open on a plastic chair, and someone's coffee has gone cold on the counter.

Outside the long viewport, the galaxy turns slowly — stars drifting silent across the black, a distant planet glowing dim against the dark.

You fold one shirt. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','deep focus','focus music','star wars ambient','death star','space ambient','sci-fi ambient','laundromat','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','fantasy mashup','star wars','death star','space','laundromat','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#StarWars #DeathStar #Space #Laundromat',
  },
  'jedi-temple-gaming': {
    place: 'Jedi Temple Gaming Lounge', lfHours: 1,
    shTitle: 'POV: A Gaming Lounge in the Jedi Temple #Shorts',
    shHook: 'Calm, focus, the Force. What are you playing?',
    lfStory: `The temple is quiet tonight, and the city outside is glowing.

Soft screens hum low along the curved walls. Worn leather seats face the holo-displays, controllers resting easy on the armrests. A datapad blinks slow on the side table.

Outside the tall windows, Coruscant drifts past in lines of light — endless traffic threading the towers, the temple spires faint against the warm dusk.

You drop into a seat. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','deep focus','focus music','star wars ambient','jedi temple','coruscant','gaming ambient','lofi gaming','sci-fi ambient','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','fantasy mashup','star wars','jedi','coruscant','gaming','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#StarWars #Jedi #Gaming #Coruscant',
  },
  'moria-cinema': {
    place: 'Mines of Moria Cinema', lfHours: 1,
    shTitle: 'POV: A Cinema in the Mines of Moria #Shorts',
    shHook: 'Deep dark, flickering light. What would you watch?',
    lfStory: `You opened the wrong door.

The great dwarven pillars still climb into shadow. The stone steps still wind down into the deep. Old runes still glint faint along the walls.

But tonight a screen flickers warm against the dark — rows of carved stone seats, popcorn glowing gold in the projector light, the film humming softly through the vast hall.

You take a seat near the back. You breathe. You stay.`,
    lfTags: ['1 hour ambient','ambient','calm music','concentration music','cozy','dark academia','deep focus','fantasy ambient','focus music','lord of the rings ambient','lotr ambient','moria','dwarven','cave ambient','cinema','realm blender','relaxing','sleep music','study music','study with me'],
    shTags: ['aesthetic','ambient','ambient shorts','cozy','dark academia','fantasy','fantasy mashup','lord of the rings','lotr','moria','dwarven','cinema','lo-fi','lofi shorts','pov','realm blender','relaxing','shorts','study music','study music shorts','study with me'],
    hashtags: '#LOTR #Moria #Cinema #Fantasy',
  },
};

async function main() {
  const themeId = process.argv[2];
  if (!themeId) { console.error('Usage: node upload-pair.js <theme-id>'); process.exit(1); }
  const c = COPY[themeId];
  if (!c) { console.error(`No upload copy for "${themeId}". Add it to COPY in upload-pair.js.`); process.exit(1); }

  const lfFile = path.resolve(__dirname, '..', 'renders', `${themeId}.mp4`);
  const shFile = path.resolve(__dirname, '..', 'shorts', `${themeId}-short.mp4`);
  const thumb  = path.resolve(__dirname, '..', 'thumbnails', `${themeId}.jpg`);
  for (const [label, f] of [['long-form', lfFile], ['short', shFile], ['thumbnail', thumb]]) {
    if (!fs.existsSync(f)) { console.error(`Missing ${label}: ${f}`); process.exit(1); }
  }

  const hours = c.lfHours === 2 ? '2 Hour' : '1 Hour';
  const lfTitle = `${c.place} | ${hours} Calm Focus Music | Relax, Study, Sleep`;
  const lfDescription = `${c.lfStory}

Perfect for studying, deep focus, sleep, or relaxation.

Subscribe for more fantasy x real life ambient worlds.

#Ambient #StudyMusic ${c.hashtags} #LoFi #StudyWithMe #DarkAcademia #SleepMusic`;

  const auth = await authenticate();
  const youtube = google.youtube({ version: 'v3', auth });

  // 1) long-form first
  console.log('\n=== [1/2] LONG-FORM ===\n');
  const lf = await uploadVideo({
    filePath: lfFile, title: lfTitle, description: lfDescription,
    tags: c.lfTags, categoryId: '10', privacyStatus: 'public',
    isShort: false, thumbnailPath: thumb,
  });
  console.log(`Long-form: https://youtube.com/watch?v=${lf.id}`);

  console.log('\nWaiting 30 seconds...');
  await new Promise(r => setTimeout(r, 30000));

  // 2) short — goal is SUBSCRIBERS. Description leads with the sub ask; the
  //    long-form link is still included as a secondary option, lower down.
  console.log('\n=== [2/2] SHORT ===\n');
  const shDescription = `${c.shHook}

🔔 SUBSCRIBE for a new realm every day — cozy worlds to study & sleep to.

Full 1-hour version: https://youtube.com/watch?v=${lf.id}

#Shorts #Ambient #StudyMusic ${c.hashtags} #LoFi #StudyWithMe #DarkAcademia`;
  const sh = await uploadVideo({
    filePath: shFile, title: c.shTitle, description: shDescription,
    tags: c.shTags, categoryId: '10', privacyStatus: 'public', isShort: true,
  });
  console.log(`Short: https://youtube.com/watch?v=${sh.id}`);

  // comment: engagement question (drives replies) — pin it in Studio
  const comment = `${c.shHook} 🔔 Subscribe for a new realm every day.`;
  await youtube.commentThreads.insert({
    part: 'snippet',
    requestBody: { snippet: { videoId: sh.id, topLevelComment: { snippet: { textOriginal: comment } } } },
  });
  console.log('Comment posted (PIN IT in Studio).');

  // add both to playlists
  const pl = await youtube.playlists.list({ part: 'snippet', mine: true, maxResults: 50 });
  let lfPl, shPl;
  for (const p of pl.data.items) {
    if (p.snippet.title.includes('1 Hour Ambient')) lfPl = p.id;
    if (p.snippet.title === 'Realm Blender — Shorts') shPl = p.id;
  }
  if (lfPl) await youtube.playlistItems.insert({ part: 'snippet', requestBody: { snippet: { playlistId: lfPl, resourceId: { kind: 'youtube#video', videoId: lf.id } } } });
  if (shPl) await youtube.playlistItems.insert({ part: 'snippet', requestBody: { snippet: { playlistId: shPl, resourceId: { kind: 'youtube#video', videoId: sh.id } } } });
  console.log('Added both to playlists.');

  console.log('\n=== DONE ===');
  console.log(`Long-form: https://youtube.com/watch?v=${lf.id}`);
  console.log(`Short:     https://youtube.com/watch?v=${sh.id}`);
  console.log('\n*** MANUAL STEP — do this in YouTube Studio: ***');
  console.log('  Pin the comment on the Short (keeps the sub ask + question visible).');
}

main().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
