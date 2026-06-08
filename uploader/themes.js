// themes.js — single source of truth for every Realm Blender theme.
// make-short.js, make-longform.js, make-thumbnail.js all read this.
// Define a theme ONCE here.
//
// Each theme needs:  images/<id>.png  and  music/<id>/*.mp3
//
// Fields:
//   location  - opening on-screen line for the Short (NO "POV:" prefix)
//   vibe      - 2nd line, short sensory fragment
//   question  - 3rd line, engagement question
//   thumb     - thumbnail text, "Place × Business" format (channel style)
//   openText  - (optional) overrides `location` as the literal opening line
//   musicStart- (optional) force the Short's music start (s); else auto-detected
//
// On-screen text is ALL CAPS, kept short. Long lines auto-wrap. The Short's
// 4th beat (CTA) is fixed in make-short.js: "1 HOUR TO STUDY OR SLEEP / ON OUR CHANNEL".

const THEMES = {
  // --- fictional-location themes ---
  'mordor-cafe':           { location: 'CAFE IN MORDOR',              vibe: 'LAVA. ESPRESSO.',                  question: 'WOULD YOU GO?',              thumb: 'Mordor × Café' },
  'shire-ramen':           { location: 'RAMEN SHOP IN THE SHIRE',     vibe: 'STEAM. SECOND BREAKFAST.',          question: 'WHAT ARE YOU ORDERING?',     thumb: 'Shire × Ramen' },
  'iron-throne-fiesta':    { location: 'FIESTA AT THE IRON THRONE',   vibe: 'TACOS. TARGARYENS.',                question: 'WOULD YOU DANCE HERE?',      thumb: 'Iron Throne × Fiesta' },
  'rivendell-gym':         { location: 'GYM IN RIVENDELL',            vibe: 'ELVEN GAINS.',                      question: 'WHAT IS YOUR SPLIT?',        thumb: 'Rivendell × Gym' },
  'batcave-pizza':         { location: 'PIZZA IN THE BATCAVE',        vibe: 'DEEP. DARK. DELICIOUS.',            question: 'WHAT ARE YOU ORDERING?',     thumb: 'Batcave × Pizza' },
  'castle-black-spa':      { location: 'A SPA AT CASTLE BLACK',       vibe: 'SNOW. STEAM. SILENCE.',             question: 'WOULD YOU RELAX HERE?',      thumb: 'Castle Black × Spa' },
  'dragonstone-karaoke':   { location: 'KARAOKE AT DRAGONSTONE',      vibe: 'NEON. DRAGONS. ENCORE.',            question: 'WHAT IS YOUR SONG?',         thumb: 'Dragonstone × Karaoke' },
  'jabba-nail-salon':      { location: 'NAIL SALON IN JABBA’S PALACE', vibe: 'SLOW. SLIMY. STYLISH.',        question: 'WOULD YOU BOOK IN?',         thumb: "Jabba's Palace × Nail Salon" },
  'hogwarts-tokyo':        { location: 'HOGWARTS IN TOKYO AT 3AM',    vibe: 'RAIN. NEON. MAGIC.',                question: 'WOULD YOU STUDY HERE?',      thumb: 'Hogwarts × Tokyo' },
  'hogwarts-kyoto':        { location: 'HOGWARTS IN SNOWY KYOTO',     vibe: 'SNOWFALL. LANTERNS. OLD MAGIC.',    question: 'WOULD YOU STUDY HERE?',      thumb: 'Hogwarts × Kyoto' },
  'hogwarts-venice':       { location: 'HOGWARTS ON THE VENICE CANALS', vibe: 'CANDLELIGHT. STILL WATER. OLD MAGIC.', question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × Venice' },
  'hogwarts-london':       { location: 'HOGWARTS IN RAINY LONDON',     vibe: 'RAIN. LANTERNS. OLD MAGIC.',          question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × London' },
  'hogwarts-newyork':      { location: 'HOGWARTS IN RAINY NEW YORK',   vibe: 'RAIN. CITY LIGHTS. OLD MAGIC.',       question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × New York' },
  'hogwarts-paris':        { location: 'HOGWARTS IN RAINY PARIS',      vibe: 'RAIN. EIFFEL TOWER. OLD MAGIC.',      question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × Paris', shortCta: ['STAY COZY', 'SUB FOR MORE LIKE THIS'] },
  'hogwarts-rome':         { location: 'HOGWARTS IN GOLDEN ROME',      vibe: 'SUNSET. COLOSSEUM. OLD MAGIC.',       question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × Rome', shortCta: ['LIKE WHAT YOU SEE?', 'TAP SUBSCRIBE'] },
  'hogwarts-prague':       { location: 'HOGWARTS IN SNOWY PRAGUE',     vibe: 'SNOW. GOTHIC SPIRES. OLD MAGIC.',     question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × Prague', shortCta: ['NEW HERE?', 'STICK AROUND'] },
  'hogwarts-edinburgh':    { location: 'HOGWARTS IN MISTY EDINBURGH',  vibe: 'MIST. CASTLE ROCK. OLD MAGIC.',       question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × Edinburgh', shortCta: ['KEEP ME GROWING', 'SUBSCRIBE TO HELP'] },
  'hogwarts-shanghai':     { location: 'HOGWARTS IN OLD SHANGHAI',     vibe: 'RAIN. NEON. OLD MAGIC.',              question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × Shanghai' },
  'hogwarts-vegas':        { location: 'HOGWARTS IN LAS VEGAS',        vibe: 'NEON. DESERT NIGHT. OLD MAGIC.',      question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × Las Vegas' },
  'hogwarts-egypt':        { location: 'HOGWARTS BY THE PYRAMIDS',     vibe: 'GOLDEN SANDS. OLD MAGIC.',            question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × Egypt' },
  'hogwarts-aurora':       { location: 'HOGWARTS UNDER THE AURORA',    vibe: 'AURORA. SNOW. OLD MAGIC.',            question: 'WOULD YOU STUDY HERE?', thumb: 'Hogwarts × Northern Lights' },
  'chamber-nightclub':     { location: 'A NIGHTCLUB IN THE CHAMBER OF SECRETS', vibe: 'NEON. SERPENTS. BASS.',  question: 'WOULD YOU DANCE HERE?',      thumb: 'Chamber × Nightclub' },
  'dagobah-bookstore':     { location: 'A BOOKSTORE ON DAGOBAH',       vibe: 'MIST. PAGES. STILLNESS.',         question: 'WHAT WOULD YOU READ?',       thumb: 'Dagobah × Bookstore' },
  'deathstar-laundromat':  { location: 'A LAUNDROMAT ON THE DEATH STAR', vibe: 'SPIN CYCLE. DEEP SPACE.',       question: 'WOULD YOU DO LAUNDRY HERE?', thumb: 'Death Star × Laundromat' },
  'diagon-alley-birdshop': { location: 'A BIRD SHOP IN DIAGON ALLEY',  vibe: 'RAIN. FEATHERS. MAGIC.',          question: 'WHICH BIRD DO YOU PICK?',    thumb: 'Diagon Alley × Bird Shop' },
  'diagon-alley-thrift':   { location: 'A THRIFT STORE IN DIAGON ALLEY', vibe: 'OLD ROBES. OLD MAGIC.',         question: 'WHAT WOULD YOU BUY?',        thumb: 'Diagon Alley × Thrift' },
  'gotham-diner':          { location: 'A LATE-NIGHT DINER IN GOTHAM', vibe: 'RAIN. NEON. BLACK COFFEE.',       question: 'WHAT ARE YOU ORDERING?',     thumb: 'Gotham × Diner' },
  'hogwarts-express-tattoo': { location: 'A TATTOO PARLOR ON THE HOGWARTS EXPRESS', vibe: 'STEAM. INK. MAGIC.', question: 'WHAT WOULD YOU GET?',        thumb: 'Hogwarts Express × Tattoo' },
  'jedi-temple-gaming':    { location: 'A GAMING LOUNGE IN THE JEDI TEMPLE', vibe: 'CALM. FOCUS. THE FORCE.',   question: 'WHAT ARE YOU PLAYING?',      thumb: 'Jedi Temple × Gaming Café' },
  'kings-landing-jazz':    { location: 'A JAZZ BAR IN KING’S LANDING', vibe: 'SMOKE. STRINGS. INTRIGUE.',       question: 'WOULD YOU STAY LATE?',       thumb: "King's Landing × Jazz" },
  'wakanda-barbershop':    { location: 'A BARBERSHOP IN WAKANDA',       vibe: 'VIBRANIUM FADE.',                 question: 'RATE THIS CUT 1-10',         thumb: 'Wakanda × Barbershop' },
  'winterfell-piano-bar':  { location: 'A PIANO BAR IN WINTERFELL',     vibe: 'SNOW. CANDLELIGHT. SLOW KEYS.',   question: 'WOULD YOU STAY THE NIGHT?',  thumb: 'Winterfell × Piano Bar' },

  // --- nature themes (openText overrides the opening line) ---
  'moonlit-lake':          { openText: 'A QUIET NIGHT BY THE LAKE',   vibe: 'MOONLIGHT. FIREFLIES. CALM.',       question: 'COULD YOU SLEEP HERE?',      thumb: 'Moonlit Lake' },
  'enchanted-forest':      { openText: 'LOST IN AN ENCHANTED FOREST', vibe: 'FIREFLIES. SOFT WIND. PEACE.',      question: 'WOULD YOU STAY THE NIGHT?',  thumb: 'Enchanted Forest' },
  'bioluminescent-ocean':  { openText: 'A GLOWING OCEAN AT NIGHT',    vibe: 'WAVES. BLUE LIGHT. STILLNESS.',     question: 'COULD YOU DRIFT OFF HERE?',  thumb: 'Bioluminescent Ocean' },
  'cozy-cabin-snow':       { openText: 'A SNOWED-IN MOUNTAIN CABIN',  vibe: 'FIRE. SNOWFALL. STILLNESS.',        question: 'WOULD YOU SLEEP HERE?',      thumb: 'Cozy Cabin', shortCta: ['COZY CHANNEL', 'SUB TO STAY WARM'] },
};

module.exports = { THEMES };
