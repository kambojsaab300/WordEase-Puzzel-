// Theme word lists per world. Family-friendly: no brands, politics or religion.
// Every word needs a meaning (WordNet or tools/meanings-extra.json); the level tool checks this.
export type Theme = { name: string; words: string[] };

export const THEMES_BY_WORLD: Theme[][] = [
  // 1 Home Town
  [
    { name: 'Around Town', words: ['HOME', 'PARK', 'SHOP', 'BAKERY', 'SCHOOL', 'GARDEN', 'BENCH', 'LIBRARY', 'MARKET', 'BUS', 'POND', 'STREET', 'BRIDGE', 'STATION', 'HOSPITAL', 'FOUNTAIN'] },
    { name: 'Kitchen Table', words: ['PLATE', 'CUP', 'SPOON', 'FORK', 'KETTLE', 'TEAPOT', 'BREAD', 'BUTTER', 'JAM', 'HONEY', 'TOAST', 'APRON', 'OVEN', 'BOWL', 'NAPKIN', 'SAUCER'] },
  ],
  // 2 Paris
  [
    { name: 'Paris Cafe', words: ['CAFE', 'CREPE', 'MENU', 'TABLE', 'CHEF', 'TEA', 'CAKE', 'SUGAR', 'CREAM', 'COFFEE', 'PASTRY', 'WAITER', 'BAGUETTE', 'CHEESE', 'TART', 'SAUCER'] },
    { name: 'Paris Streets', words: ['RIVER', 'BRIDGE', 'TOWER', 'MUSEUM', 'PAINTER', 'ARTIST', 'BOAT', 'STREET', 'GARDEN', 'FASHION', 'HAT', 'SCARF', 'BICYCLE', 'LAMP', 'AVENUE', 'PALACE'] },
  ],
  // 3 Italy
  [
    { name: 'Italian Kitchen', words: ['PASTA', 'PIZZA', 'OLIVE', 'TOMATO', 'BASIL', 'CHEESE', 'LEMON', 'GARLIC', 'BREAD', 'SAUCE', 'NOODLE', 'OVEN', 'DOUGH', 'PEPPER', 'ONION', 'SALAD'] },
    { name: 'Italian Journey', words: ['GONDOLA', 'CANAL', 'VILLA', 'PIAZZA', 'FOUNTAIN', 'STATUE', 'OPERA', 'VIOLIN', 'SCOOTER', 'VINEYARD', 'HILL', 'COLUMN', 'ARCH', 'MOSAIC', 'DOME', 'TOWER'] },
  ],
  // 4 Greek Islands
  [
    { name: 'Island Life', words: ['ISLAND', 'SEA', 'BOAT', 'HARBOR', 'SAIL', 'ANCHOR', 'FISH', 'OCTOPUS', 'SPONGE', 'SHELL', 'BEACH', 'SAND', 'WAVE', 'SUNSET', 'CLIFF', 'LIGHTHOUSE'] },
    { name: 'Greek Garden', words: ['OLIVE', 'FIG', 'GRAPE', 'LEMON', 'HONEY', 'YOGURT', 'GOAT', 'DONKEY', 'THYME', 'MINT', 'ORANGE', 'ALMOND', 'POTTERY', 'VASE', 'TERRACE', 'WINDMILL'] },
  ],
  // 5 Egypt
  [
    { name: 'Desert Trip', words: ['DESERT', 'SAND', 'CAMEL', 'DUNE', 'OASIS', 'PALM', 'PYRAMID', 'SUN', 'TENT', 'WATER', 'SCARF', 'COMPASS', 'CARAVAN', 'LIZARD', 'SCORPION', 'STAR'] },
    { name: 'River Life', words: ['RIVER', 'BOAT', 'REED', 'PAPYRUS', 'CROCODILE', 'HERON', 'FISH', 'DATE', 'LOTUS', 'DELTA', 'MUD', 'FARMER', 'WHEAT', 'BREAD', 'ONION', 'CANAL'] },
  ],
  // 6 Kenya Safari
  [
    { name: 'Safari Animals', words: ['LION', 'ZEBRA', 'GIRAFFE', 'ELEPHANT', 'RHINO', 'HIPPO', 'CHEETAH', 'LEOPARD', 'BUFFALO', 'ANTELOPE', 'GAZELLE', 'HYENA', 'MONKEY', 'OSTRICH', 'FLAMINGO', 'VULTURE'] },
    { name: 'Savanna', words: ['GRASS', 'ACACIA', 'RIVER', 'SUNRISE', 'CAMERA', 'BINOCULARS', 'TENT', 'TRAIL', 'DUST', 'RAIN', 'STORM', 'HORIZON', 'SHADE', 'THORN', 'TRACK', 'HILL'] },
  ],
  // 7 India
  [
    { name: 'Spice Market', words: ['SPICE', 'PEPPER', 'GINGER', 'CUMIN', 'TURMERIC', 'CHILI', 'CINNAMON', 'CLOVE', 'MANGO', 'RICE', 'LENTIL', 'TEA', 'COCONUT', 'SAFFRON', 'CARDAMOM', 'MINT'] },
    { name: 'Colours of India', words: ['SARI', 'BANGLE', 'KITE', 'PEACOCK', 'ELEPHANT', 'TIGER', 'LOTUS', 'RICKSHAW', 'PALACE', 'FORT', 'JASMINE', 'MARIGOLD', 'DRUM', 'FLUTE', 'DANCE', 'LANTERN'] },
  ],
  // 8 Thailand
  [
    { name: 'Floating Market', words: ['BOAT', 'FRUIT', 'MANGO', 'PAPAYA', 'BANANA', 'COCONUT', 'NOODLE', 'BASKET', 'HAT', 'PADDLE', 'CANAL', 'RICE', 'LIME', 'BASIL', 'CURRY', 'ORCHID'] },
    { name: 'Beach Island', words: ['BEACH', 'PALM', 'CORAL', 'TURTLE', 'SNORKEL', 'KAYAK', 'HAMMOCK', 'STARFISH', 'LAGOON', 'SHELL', 'ISLAND', 'REEF', 'CRAB', 'WAVE', 'SAND', 'TIDE'] },
  ],
  // 9 Japan
  [
    { name: 'Japanese Garden', words: ['CHERRY', 'BLOSSOM', 'POND', 'BRIDGE', 'STONE', 'MOSS', 'BAMBOO', 'MAPLE', 'LANTERN', 'CARP', 'TEA', 'GATE', 'PATH', 'PINE', 'BONSAI', 'PEBBLE'] },
    { name: 'City Day', words: ['TRAIN', 'STATION', 'ROBOT', 'CAMERA', 'NOODLE', 'SUSHI', 'UMBRELLA', 'FAN', 'KIMONO', 'TOWER', 'NEON', 'STREET', 'SCOOTER', 'TICKET', 'SUBWAY', 'MAP'] },
  ],
  // 10 Great Wall
  [
    { name: 'The Great Wall', words: ['WALL', 'TOWER', 'STONE', 'BRICK', 'GATE', 'HILL', 'STAIRS', 'DRAGON', 'KITE', 'LANTERN', 'SILK', 'TEA', 'JADE', 'PANDA', 'BAMBOO', 'FAN'] },
    { name: 'Noodle Shop', words: ['DUMPLING', 'NOODLE', 'RICE', 'TOFU', 'WOK', 'GINGER', 'GARLIC', 'SOUP', 'BUN', 'CHOPSTICKS', 'TEAPOT', 'PEANUT', 'CABBAGE', 'MUSHROOM', 'PEPPER', 'ONION'] },
  ],
  // 11 Australia Outback
  [
    { name: 'Outback Animals', words: ['KANGAROO', 'KOALA', 'WOMBAT', 'EMU', 'DINGO', 'PLATYPUS', 'WALLABY', 'LIZARD', 'PARROT', 'COCKATOO', 'SNAKE', 'SPIDER', 'CROCODILE', 'ECHIDNA', 'KOOKABURRA', 'EAGLE'] },
    { name: 'Red Desert', words: ['DESERT', 'ROCK', 'CANYON', 'DUST', 'SUNSET', 'CAMPFIRE', 'STARS', 'BOOMERANG', 'EUCALYPTUS', 'BUSH', 'TRUCK', 'WINDMILL', 'WELL', 'RANCH', 'HAT', 'CREEK'] },
  ],
  // 12 Hawaii Islands
  [
    { name: 'Aloha Beach', words: ['SURF', 'WAVE', 'BEACH', 'VOLCANO', 'LAVA', 'PALM', 'COCONUT', 'PINEAPPLE', 'TURTLE', 'DOLPHIN', 'WHALE', 'HULA', 'UKULELE', 'LEI', 'SHELL', 'REEF'] },
    { name: 'Tropical Garden', words: ['HIBISCUS', 'ORCHID', 'FRANGIPANI', 'FERN', 'BANANA', 'MANGO', 'PAPAYA', 'GUAVA', 'WATERFALL', 'RAINBOW', 'BREEZE', 'GECKO', 'BUTTERFLY', 'PARROT', 'VALLEY', 'MIST'] },
  ],
  // 13 Mexico Fiesta
  [
    { name: 'Fiesta', words: ['FIESTA', 'PINATA', 'GUITAR', 'TRUMPET', 'MARACA', 'SOMBRERO', 'DANCE', 'PARADE', 'BALLOON', 'CANDY', 'CONFETTI', 'MUSIC', 'DRUM', 'LANTERN', 'FLOWER', 'RIBBON'] },
    { name: 'Market Stall', words: ['TACO', 'TORTILLA', 'AVOCADO', 'CORN', 'BEAN', 'CHILI', 'LIME', 'TOMATO', 'CHOCOLATE', 'VANILLA', 'CACTUS', 'POTTERY', 'BLANKET', 'BASKET', 'SALSA', 'PEPPER'] },
  ],
  // 14 Peru Mountains
  [
    { name: 'Mountain Trek', words: ['MOUNTAIN', 'LLAMA', 'ALPACA', 'CONDOR', 'PEAK', 'VALLEY', 'TRAIL', 'CLOUD', 'GLACIER', 'RIVER', 'BRIDGE', 'TERRACE', 'BACKPACK', 'ROPE', 'CAMP', 'SUMMIT'] },
    { name: 'Mountain Village', words: ['POTATO', 'QUINOA', 'CORN', 'WOOL', 'PONCHO', 'WEAVER', 'BLANKET', 'MARKET', 'FLUTE', 'DRUM', 'HAT', 'STONE', 'ROOF', 'FARM', 'SHEEP', 'GOAT'] },
  ],
  // 15 Brazil Rainforest
  [
    { name: 'Rainforest', words: ['JUNGLE', 'RIVER', 'PARROT', 'TOUCAN', 'MONKEY', 'JAGUAR', 'SLOTH', 'FROG', 'BUTTERFLY', 'ORCHID', 'VINE', 'CANOPY', 'RAIN', 'ANACONDA', 'PIRANHA', 'TAPIR'] },
    { name: 'Carnival', words: ['SAMBA', 'DRUM', 'PARADE', 'COSTUME', 'FEATHER', 'MASK', 'DANCE', 'MUSIC', 'BEACH', 'FOOTBALL', 'COCONUT', 'GUITAR', 'SUNSHINE', 'CONFETTI', 'SEQUIN', 'WHISTLE'] },
  ],
  // 16 Canada Lakes
  [
    { name: 'Lakeside Cabin', words: ['LAKE', 'CANOE', 'CABIN', 'PADDLE', 'FISHING', 'LOON', 'MOOSE', 'BEAVER', 'BEAR', 'PINE', 'MAPLE', 'CAMPFIRE', 'TENT', 'TRAIL', 'ISLAND', 'DOCK'] },
    { name: 'Winter Fun', words: ['SNOW', 'SKATE', 'SLED', 'HOCKEY', 'MITTEN', 'SCARF', 'ICICLE', 'BLIZZARD', 'SNOWMAN', 'SKI', 'COCOA', 'SYRUP', 'PANCAKE', 'TOBOGGAN', 'FROST', 'LODGE'] },
  ],
  // 17 New York
  [
    { name: 'City Life', words: ['TAXI', 'SUBWAY', 'BRIDGE', 'SKYSCRAPER', 'PARK', 'MUSEUM', 'THEATER', 'BAGEL', 'PRETZEL', 'PIZZA', 'STREET', 'AVENUE', 'TOWER', 'STATUE', 'HARBOR', 'FERRY'] },
    { name: 'Show Night', words: ['STAGE', 'ACTOR', 'DANCER', 'SINGER', 'CURTAIN', 'TICKET', 'SPOTLIGHT', 'ORCHESTRA', 'PIANO', 'DRUMMER', 'COSTUME', 'APPLAUSE', 'ENCORE', 'MUSICAL', 'BALCONY', 'LOBBY'] },
  ],
  // 18 Iceland Lights
  [
    { name: 'Northern Lights', words: ['AURORA', 'GLACIER', 'VOLCANO', 'GEYSER', 'ICE', 'SNOW', 'FJORD', 'WATERFALL', 'LAVA', 'STARS', 'NIGHT', 'MOON', 'CLOUD', 'WIND', 'COLD', 'STEAM'] },
    { name: 'Fishing Village', words: ['HARBOR', 'BOAT', 'NET', 'FISH', 'COD', 'HERRING', 'WHALE', 'PUFFIN', 'SEAL', 'LIGHTHOUSE', 'COTTAGE', 'WOOL', 'SWEATER', 'STORM', 'ROPE', 'ANCHOR'] },
  ],
  // 19 Scotland Highlands
  [
    { name: 'Highlands', words: ['CASTLE', 'LOCH', 'GLEN', 'MOOR', 'HEATHER', 'THISTLE', 'HILL', 'MIST', 'STAG', 'DEER', 'EAGLE', 'SHEEP', 'CLIFF', 'VALLEY', 'STREAM', 'BRIDGE'] },
    { name: 'Highland Games', words: ['BAGPIPE', 'KILT', 'TARTAN', 'DRUM', 'DANCE', 'FIDDLE', 'CABER', 'HAMMER', 'ROPE', 'RACE', 'PIPER', 'SHORTBREAD', 'PORRIDGE', 'OATS', 'SCONE', 'TEA'] },
  ],
  // 20 Antarctica
  [
    { name: 'Frozen South', words: ['PENGUIN', 'SEAL', 'WHALE', 'ICEBERG', 'GLACIER', 'SNOW', 'ICE', 'BLIZZARD', 'KRILL', 'ALBATROSS', 'PETREL', 'SLED', 'TENT', 'EXPLORER', 'COMPASS', 'IGLOO'] },
    { name: 'Polar Station', words: ['STATION', 'SCIENTIST', 'RESEARCH', 'RADIO', 'SATELLITE', 'TELESCOPE', 'WEATHER', 'BALLOON', 'THERMOMETER', 'ROVER', 'LABORATORY', 'GENERATOR', 'PARKA', 'GOGGLES', 'HELMET', 'MAP'] },
  ],
];
