// Theme word lists per world. Family-friendly: no brands, politics or religion.
// Every word needs a meaning (WordNet or tools/meanings-extra.json); the level tool checks this.
export type Theme = { name: string; words: string[] };

export const THEMES_BY_WORLD: Theme[][] = [
  // 1 Home Town
  [
    { name: 'Around Town', words: ['HOME', 'PARK', 'SHOP', 'BAKERY', 'SCHOOL', 'GARDEN', 'BENCH', 'LIBRARY', 'MARKET', 'BUS', 'POND', 'STREET', 'BRIDGE', 'STATION', 'HOSPITAL', 'FOUNTAIN'] },
    { name: 'Kitchen Table', words: ['PLATE', 'CUP', 'SPOON', 'FORK', 'KETTLE', 'TEAPOT', 'BREAD', 'BUTTER', 'JAM', 'HONEY', 'TOAST', 'APRON', 'OVEN', 'BOWL', 'NAPKIN', 'SAUCER'] },
    { name: 'Post Office', words: ['LETTER', 'STAMP', 'PARCEL', 'ENVELOPE', 'QUEUE', 'CLERK', 'COUNTER', 'POSTCARD', 'ADDRESS', 'SCALE', 'PEN', 'STRING', 'TAPE', 'BOX', 'MAILBOX', 'DELIVERY'] },
    { name: 'Family Picnic', words: ['BLANKET', 'BASKET', 'SANDWICH', 'APPLE', 'LEMONADE', 'CHEESE', 'GRAPES', 'COOKIE', 'NAPKIN', 'FLASK', 'CUSHION', 'KITE', 'BALL', 'SUNHAT', 'MEADOW', 'SHADE'] },
  ],
  // 2 Paris
  [
    { name: 'Paris Cafe', words: ['CAFE', 'CREPE', 'MENU', 'TABLE', 'CHEF', 'TEA', 'CAKE', 'SUGAR', 'CREAM', 'COFFEE', 'PASTRY', 'WAITER', 'BAGUETTE', 'CHEESE', 'TART', 'SAUCER'] },
    { name: 'Paris Streets', words: ['RIVER', 'BRIDGE', 'TOWER', 'MUSEUM', 'PAINTER', 'ARTIST', 'BOAT', 'STREET', 'GARDEN', 'FASHION', 'HAT', 'SCARF', 'BICYCLE', 'LAMP', 'AVENUE', 'PALACE'] },
    { name: 'Art Museum', words: ['PAINTING', 'FRAME', 'SCULPTURE', 'GALLERY', 'CANVAS', 'EASEL', 'PORTRAIT', 'BRUSH', 'PALETTE', 'STATUE', 'GUIDE', 'TICKET', 'SKETCH', 'MURAL', 'PASTEL', 'CURATOR'] },
    { name: 'Bakery Window', words: ['CROISSANT', 'ECLAIR', 'MACAROON', 'BRIOCHE', 'LOAF', 'ROLL', 'FLOUR', 'YEAST', 'BAKER', 'CRUST', 'ICING', 'WHISK', 'TRAY', 'APRON', 'CUSTARD', 'MERINGUE'] },
  ],
  // 3 Italy
  [
    { name: 'Italian Kitchen', words: ['PASTA', 'PIZZA', 'OLIVE', 'TOMATO', 'BASIL', 'CHEESE', 'LEMON', 'GARLIC', 'BREAD', 'SAUCE', 'NOODLE', 'OVEN', 'DOUGH', 'PEPPER', 'ONION', 'SALAD'] },
    { name: 'Italian Journey', words: ['GONDOLA', 'CANAL', 'VILLA', 'PIAZZA', 'FOUNTAIN', 'STATUE', 'OPERA', 'VIOLIN', 'SCOOTER', 'VINEYARD', 'HILL', 'COLUMN', 'ARCH', 'MOSAIC', 'DOME', 'TOWER'] },
    { name: 'Old Rome', words: ['FORUM', 'ARENA', 'CHARIOT', 'SANDAL', 'TUNIC', 'SCROLL', 'COIN', 'AQUEDUCT', 'ROAD', 'MARBLE', 'STATUE', 'BATH', 'FOUNTAIN', 'HELMET', 'SHIELD', 'LAUREL'] },
    { name: 'Ice Cream Parlour', words: ['VANILLA', 'STRAWBERRY', 'CHOCOLATE', 'PISTACHIO', 'LEMON', 'CONE', 'SCOOP', 'SPOON', 'WAFER', 'SPRINKLES', 'CHERRY', 'CARAMEL', 'HAZELNUT', 'SORBET', 'MINT', 'CUP'] },
  ],
  // 4 Greek Islands
  [
    { name: 'Island Life', words: ['ISLAND', 'SEA', 'BOAT', 'HARBOR', 'SAIL', 'ANCHOR', 'FISH', 'OCTOPUS', 'SPONGE', 'SHELL', 'BEACH', 'SAND', 'WAVE', 'SUNSET', 'CLIFF', 'LIGHTHOUSE'] },
    { name: 'Greek Garden', words: ['OLIVE', 'FIG', 'GRAPE', 'LEMON', 'HONEY', 'YOGURT', 'GOAT', 'DONKEY', 'THYME', 'MINT', 'ORANGE', 'ALMOND', 'POTTERY', 'VASE', 'TERRACE', 'WINDMILL'] },
    { name: 'Sailing Day', words: ['YACHT', 'MAST', 'DECK', 'ROPE', 'KNOT', 'WIND', 'COMPASS', 'CAPTAIN', 'CREW', 'BUOY', 'WAVE', 'PORT', 'HELM', 'KEEL', 'MAP', 'DOLPHIN'] },
    { name: 'Village Square', words: ['FOUNTAIN', 'ARCH', 'STEPS', 'CAT', 'DONKEY', 'OLIVE', 'LANTERN', 'BALCONY', 'SHUTTER', 'POTTERY', 'BENCH', 'MARKET', 'WELL', 'PIGEON', 'AWNING', 'DOORWAY'] },
  ],
  // 5 Egypt
  [
    { name: 'Desert Trip', words: ['DESERT', 'SAND', 'CAMEL', 'DUNE', 'OASIS', 'PALM', 'PYRAMID', 'SUN', 'TENT', 'WATER', 'SCARF', 'COMPASS', 'CARAVAN', 'LIZARD', 'SCORPION', 'STAR'] },
    { name: 'River Life', words: ['RIVER', 'BOAT', 'REED', 'PAPYRUS', 'CROCODILE', 'HERON', 'FISH', 'DATE', 'LOTUS', 'DELTA', 'MUD', 'FARMER', 'WHEAT', 'BREAD', 'ONION', 'CANAL'] },
    { name: 'Ancient Wonders', words: ['PYRAMID', 'SPHINX', 'PHARAOH', 'OBELISK', 'SCARAB', 'HIEROGLYPH', 'PAPYRUS', 'CHARIOT', 'GOLD', 'MASK', 'JEWEL', 'STATUE', 'SANDSTONE', 'QUEEN', 'CROWN', 'SCRIBE'] },
    { name: 'Bazaar', words: ['RUG', 'LAMP', 'BRASS', 'SPICE', 'PERFUME', 'BEAD', 'SCARF', 'TEA', 'COPPER', 'BASKET', 'LANTERN', 'SILVER', 'CUSHION', 'MINT', 'TRAY', 'CARPET'] },
  ],
  // 6 Kenya Safari
  [
    { name: 'Safari Animals', words: ['LION', 'ZEBRA', 'GIRAFFE', 'ELEPHANT', 'RHINO', 'HIPPO', 'CHEETAH', 'LEOPARD', 'BUFFALO', 'ANTELOPE', 'GAZELLE', 'HYENA', 'MONKEY', 'OSTRICH', 'FLAMINGO', 'VULTURE'] },
    { name: 'Savanna', words: ['GRASS', 'ACACIA', 'RIVER', 'SUNRISE', 'CAMERA', 'BINOCULARS', 'TENT', 'TRAIL', 'DUST', 'RAIN', 'STORM', 'HORIZON', 'SHADE', 'THORN', 'TRACK', 'HILL'] },
    { name: 'Birds of Africa', words: ['EAGLE', 'STORK', 'HORNBILL', 'WEAVER', 'PELICAN', 'OSTRICH', 'FLAMINGO', 'PARROT', 'HERON', 'OWL', 'KINGFISHER', 'CRANE', 'IBIS', 'VULTURE', 'SUNBIRD', 'HAWK'] },
    { name: 'Village Life', words: ['HUT', 'GOAT', 'CATTLE', 'MAIZE', 'BEAD', 'DRUM', 'WELL', 'FIRE', 'POT', 'BASKET', 'MILK', 'FIELD', 'SONG', 'DANCE', 'GOURD', 'FENCE'] },
  ],
  // 7 India
  [
    { name: 'Spice Market', words: ['SPICE', 'PEPPER', 'GINGER', 'CUMIN', 'TURMERIC', 'CHILI', 'CINNAMON', 'CLOVE', 'MANGO', 'RICE', 'LENTIL', 'TEA', 'COCONUT', 'SAFFRON', 'CARDAMOM', 'MINT'] },
    { name: 'Colours of India', words: ['SARI', 'BANGLE', 'KITE', 'PEACOCK', 'ELEPHANT', 'TIGER', 'LOTUS', 'RICKSHAW', 'PALACE', 'FORT', 'JASMINE', 'MARIGOLD', 'DRUM', 'FLUTE', 'DANCE', 'LANTERN'] },
    { name: 'Indian Kitchen', words: ['CURRY', 'RICE', 'CHAPATI', 'LENTIL', 'YOGURT', 'GHEE', 'PICKLE', 'MANGO', 'CHUTNEY', 'TEA', 'SPICE', 'GINGER', 'ONION', 'POTATO', 'PEA', 'COCONUT'] },
    { name: 'Festival Lights', words: ['LAMP', 'CANDLE', 'LANTERN', 'FIREWORK', 'GARLAND', 'DRUM', 'DANCE', 'MUSIC', 'GIFT', 'RIBBON', 'KITE', 'MARIGOLD', 'PARADE', 'CONFETTI', 'SPARKLER', 'STAR'] },
  ],
  // 8 Thailand
  [
    { name: 'Floating Market', words: ['BOAT', 'FRUIT', 'MANGO', 'PAPAYA', 'BANANA', 'COCONUT', 'NOODLE', 'BASKET', 'HAT', 'PADDLE', 'CANAL', 'RICE', 'LIME', 'BASIL', 'CURRY', 'ORCHID'] },
    { name: 'Beach Island', words: ['BEACH', 'PALM', 'CORAL', 'TURTLE', 'SNORKEL', 'KAYAK', 'HAMMOCK', 'STARFISH', 'LAGOON', 'SHELL', 'ISLAND', 'REEF', 'CRAB', 'WAVE', 'SAND', 'TIDE'] },
    { name: 'Jungle Trek', words: ['ELEPHANT', 'GIBBON', 'MONKEY', 'TIGER', 'ORCHID', 'BAMBOO', 'WATERFALL', 'RIVER', 'TRAIL', 'VINE', 'FERN', 'MIST', 'HORNBILL', 'CAVE', 'GECKO', 'MOSS'] },
    { name: 'Street Food', words: ['NOODLE', 'RICE', 'SATAY', 'MANGO', 'PEANUT', 'CHILI', 'LIME', 'COCONUT', 'SOUP', 'WOK', 'SKEWER', 'BASIL', 'SHRIMP', 'PANCAKE', 'CART', 'STOOL'] },
  ],
  // 9 Japan
  [
    { name: 'Japanese Garden', words: ['CHERRY', 'BLOSSOM', 'POND', 'BRIDGE', 'STONE', 'MOSS', 'BAMBOO', 'MAPLE', 'LANTERN', 'CARP', 'TEA', 'GATE', 'PATH', 'PINE', 'BONSAI', 'PEBBLE'] },
    { name: 'City Day', words: ['TRAIN', 'STATION', 'ROBOT', 'CAMERA', 'NOODLE', 'SUSHI', 'UMBRELLA', 'FAN', 'KIMONO', 'TOWER', 'NEON', 'STREET', 'SCOOTER', 'TICKET', 'SUBWAY', 'MAP'] },
    { name: 'Tea Time', words: ['TEA', 'KETTLE', 'BOWL', 'WHISK', 'MAT', 'CUP', 'SCROLL', 'FLOWER', 'CUSHION', 'SWEET', 'STEAM', 'BAMBOO', 'KIMONO', 'GUEST', 'GARDEN', 'TRAY'] },
    { name: 'Mountain Inn', words: ['STEAM', 'SPRING', 'TOWEL', 'STONE', 'SNOW', 'PINE', 'MOUNTAIN', 'BATH', 'ROBE', 'SLIPPER', 'LANTERN', 'MONKEY', 'RIVER', 'INN', 'MIST', 'CEDAR'] },
  ],
  // 10 Great Wall
  [
    { name: 'The Great Wall', words: ['WALL', 'TOWER', 'STONE', 'BRICK', 'GATE', 'HILL', 'STAIRS', 'DRAGON', 'KITE', 'LANTERN', 'SILK', 'TEA', 'JADE', 'PANDA', 'BAMBOO', 'FAN'] },
    { name: 'Noodle Shop', words: ['DUMPLING', 'NOODLE', 'RICE', 'TOFU', 'WOK', 'GINGER', 'GARLIC', 'SOUP', 'BUN', 'CHOPSTICKS', 'TEAPOT', 'PEANUT', 'CABBAGE', 'MUSHROOM', 'PEPPER', 'ONION'] },
    { name: 'Panda Forest', words: ['PANDA', 'BAMBOO', 'MOUNTAIN', 'MIST', 'STREAM', 'PINE', 'CRANE', 'MONKEY', 'LEAF', 'CAVE', 'BRIDGE', 'PATH', 'FERN', 'RAIN', 'MOSS', 'DEER'] },
    { name: 'Silk Road', words: ['CAMEL', 'SILK', 'SPICE', 'CARAVAN', 'DESERT', 'OASIS', 'MERCHANT', 'JADE', 'TEA', 'PORCELAIN', 'COMPASS', 'MAP', 'TENT', 'LANTERN', 'MARKET', 'COIN'] },
  ],
  // 11 Australia Outback
  [
    { name: 'Outback Animals', words: ['KANGAROO', 'KOALA', 'WOMBAT', 'EMU', 'DINGO', 'PLATYPUS', 'WALLABY', 'LIZARD', 'PARROT', 'COCKATOO', 'SNAKE', 'SPIDER', 'CROCODILE', 'ECHIDNA', 'KOOKABURRA', 'EAGLE'] },
    { name: 'Red Desert', words: ['DESERT', 'ROCK', 'CANYON', 'DUST', 'SUNSET', 'CAMPFIRE', 'STARS', 'BOOMERANG', 'EUCALYPTUS', 'BUSH', 'TRUCK', 'WINDMILL', 'WELL', 'RANCH', 'HAT', 'CREEK'] },
    { name: 'Great Reef', words: ['CORAL', 'REEF', 'TURTLE', 'SHARK', 'DOLPHIN', 'WHALE', 'SPONGE', 'STARFISH', 'LAGOON', 'ISLAND', 'SNORKEL', 'BOAT', 'SAND', 'SHELL', 'TIDE', 'OCEAN'] },
    { name: 'Sheep Station', words: ['SHEEP', 'WOOL', 'SHEARER', 'FENCE', 'PADDOCK', 'DOG', 'HORSE', 'TRACTOR', 'WINDMILL', 'GATE', 'DUST', 'HAT', 'BOOT', 'RAIN', 'BARN', 'RANCH'] },
  ],
  // 12 Hawaii Islands
  [
    { name: 'Aloha Beach', words: ['SURF', 'WAVE', 'BEACH', 'VOLCANO', 'LAVA', 'PALM', 'COCONUT', 'PINEAPPLE', 'TURTLE', 'DOLPHIN', 'WHALE', 'HULA', 'UKULELE', 'LEI', 'SHELL', 'REEF'] },
    { name: 'Tropical Garden', words: ['HIBISCUS', 'ORCHID', 'FRANGIPANI', 'FERN', 'BANANA', 'MANGO', 'PAPAYA', 'GUAVA', 'WATERFALL', 'RAINBOW', 'BREEZE', 'GECKO', 'BUTTERFLY', 'PARROT', 'VALLEY', 'MIST'] },
    { name: 'Volcano Park', words: ['VOLCANO', 'LAVA', 'CRATER', 'ASH', 'STEAM', 'ROCK', 'TRAIL', 'FERN', 'CLIFF', 'GLOW', 'SMOKE', 'PUMICE', 'BASALT', 'HEAT', 'MAGMA', 'VENT'] },
    { name: 'Island Feast', words: ['TORCH', 'DRUM', 'DANCE', 'GUITAR', 'UKULELE', 'FLOWER', 'PINEAPPLE', 'COCONUT', 'FEAST', 'SUNSET', 'BEACH', 'SONG', 'FIRE', 'LEI', 'MUSIC', 'SHELL'] },
  ],
  // 13 Mexico Fiesta
  [
    { name: 'Fiesta', words: ['FIESTA', 'PINATA', 'GUITAR', 'TRUMPET', 'MARACA', 'SOMBRERO', 'DANCE', 'PARADE', 'BALLOON', 'CANDY', 'CONFETTI', 'MUSIC', 'DRUM', 'LANTERN', 'FLOWER', 'RIBBON'] },
    { name: 'Market Stall', words: ['TACO', 'TORTILLA', 'AVOCADO', 'CORN', 'BEAN', 'CHILI', 'LIME', 'TOMATO', 'CHOCOLATE', 'VANILLA', 'CACTUS', 'POTTERY', 'BLANKET', 'BASKET', 'SALSA', 'PEPPER'] },
    { name: 'Ancient Ruins', words: ['PYRAMID', 'STONE', 'JUNGLE', 'CARVING', 'JADE', 'MASK', 'CALENDAR', 'STAIRS', 'PLAZA', 'SERPENT', 'JAGUAR', 'EAGLE', 'CORN', 'COCOA', 'RUIN', 'VINE'] },
    { name: 'Desert Ranch', words: ['CACTUS', 'HORSE', 'SADDLE', 'LASSO', 'BOOT', 'HAT', 'DUST', 'COYOTE', 'LIZARD', 'SUNSET', 'CANYON', 'FENCE', 'CORRAL', 'CATTLE', 'ROPE', 'BARN'] },
  ],
  // 14 Peru Mountains
  [
    { name: 'Mountain Trek', words: ['MOUNTAIN', 'LLAMA', 'ALPACA', 'CONDOR', 'PEAK', 'VALLEY', 'TRAIL', 'CLOUD', 'GLACIER', 'RIVER', 'BRIDGE', 'TERRACE', 'BACKPACK', 'ROPE', 'CAMP', 'SUMMIT'] },
    { name: 'Mountain Village', words: ['POTATO', 'QUINOA', 'CORN', 'WOOL', 'PONCHO', 'WEAVER', 'BLANKET', 'MARKET', 'FLUTE', 'DRUM', 'HAT', 'STONE', 'ROOF', 'FARM', 'SHEEP', 'GOAT'] },
    { name: 'Lost City', words: ['STONE', 'TERRACE', 'WALL', 'STAIRS', 'RUIN', 'CLOUD', 'PEAK', 'LLAMA', 'CONDOR', 'TRAIL', 'GATE', 'TOWER', 'SUNRISE', 'VALLEY', 'ORCHID', 'MIST'] },
    { name: 'Floating Islands', words: ['REED', 'BOAT', 'ISLAND', 'LAKE', 'FISH', 'NET', 'HUT', 'WEAVER', 'BLANKET', 'SUN', 'WIND', 'DUCK', 'CANOE', 'ROPE', 'BASKET', 'SHORE'] },
  ],
  // 15 Brazil Rainforest
  [
    { name: 'Rainforest', words: ['JUNGLE', 'RIVER', 'PARROT', 'TOUCAN', 'MONKEY', 'JAGUAR', 'SLOTH', 'FROG', 'BUTTERFLY', 'ORCHID', 'VINE', 'CANOPY', 'RAIN', 'ANACONDA', 'PIRANHA', 'TAPIR'] },
    { name: 'Carnival', words: ['SAMBA', 'DRUM', 'PARADE', 'COSTUME', 'FEATHER', 'MASK', 'DANCE', 'MUSIC', 'BEACH', 'FOOTBALL', 'COCONUT', 'GUITAR', 'SUNSHINE', 'CONFETTI', 'SEQUIN', 'WHISTLE'] },
    { name: 'River Trip', words: ['RIVER', 'CANOE', 'DOLPHIN', 'PIRANHA', 'PARROT', 'JUNGLE', 'BANK', 'MUD', 'FISH', 'NET', 'HAMMOCK', 'RAIN', 'VINE', 'OTTER', 'TURTLE', 'MIST'] },
    { name: 'Beach Town', words: ['BEACH', 'SAND', 'WAVE', 'SURF', 'KITE', 'COCONUT', 'UMBRELLA', 'SUNSHINE', 'SHELL', 'VOLLEYBALL', 'BOARDWALK', 'TOWEL', 'SANDAL', 'CRAB', 'GULL', 'TIDE'] },
  ],
  // 16 Canada Lakes
  [
    { name: 'Lakeside Cabin', words: ['LAKE', 'CANOE', 'CABIN', 'PADDLE', 'FISHING', 'LOON', 'MOOSE', 'BEAVER', 'BEAR', 'PINE', 'MAPLE', 'CAMPFIRE', 'TENT', 'TRAIL', 'ISLAND', 'DOCK'] },
    { name: 'Winter Fun', words: ['SNOW', 'SKATE', 'SLED', 'HOCKEY', 'MITTEN', 'SCARF', 'ICICLE', 'BLIZZARD', 'SNOWMAN', 'SKI', 'COCOA', 'SYRUP', 'PANCAKE', 'TOBOGGAN', 'FROST', 'LODGE'] },
    { name: 'Rocky Mountains', words: ['PEAK', 'GLACIER', 'ELK', 'GOAT', 'EAGLE', 'PINE', 'TRAIL', 'LAKE', 'CANYON', 'SNOW', 'RIVER', 'BEAR', 'CABIN', 'CLIFF', 'RIDGE', 'MEADOW'] },
    { name: 'Maple Farm', words: ['MAPLE', 'SYRUP', 'SAP', 'BUCKET', 'SPRING', 'SNOW', 'BARN', 'TRACTOR', 'PANCAKE', 'WAFFLE', 'BUTTER', 'LOG', 'FIRE', 'WOOD', 'SLED', 'TREE'] },
  ],
  // 17 New York
  [
    { name: 'City Life', words: ['TAXI', 'SUBWAY', 'BRIDGE', 'SKYSCRAPER', 'PARK', 'MUSEUM', 'THEATER', 'BAGEL', 'PRETZEL', 'PIZZA', 'STREET', 'AVENUE', 'TOWER', 'STATUE', 'HARBOR', 'FERRY'] },
    { name: 'Show Night', words: ['STAGE', 'ACTOR', 'DANCER', 'SINGER', 'CURTAIN', 'TICKET', 'SPOTLIGHT', 'ORCHESTRA', 'PIANO', 'DRUMMER', 'COSTUME', 'APPLAUSE', 'ENCORE', 'MUSICAL', 'BALCONY', 'LOBBY'] },
    { name: 'Central Park', words: ['PARK', 'POND', 'BENCH', 'TREE', 'SQUIRREL', 'ROWBOAT', 'ZOO', 'BRIDGE', 'LAWN', 'CAROUSEL', 'PICNIC', 'JOGGER', 'KITE', 'FOUNTAIN', 'PATH', 'DUCK'] },
    { name: 'Deli Lunch', words: ['BAGEL', 'SANDWICH', 'PICKLE', 'CHEESE', 'SOUP', 'COFFEE', 'MUFFIN', 'COOKIE', 'SALAD', 'MUSTARD', 'BREAD', 'TURKEY', 'TOMATO', 'LETTUCE', 'NAPKIN', 'TRAY'] },
  ],
  // 18 Iceland Lights
  [
    { name: 'Northern Lights', words: ['AURORA', 'GLACIER', 'VOLCANO', 'GEYSER', 'ICE', 'SNOW', 'FJORD', 'WATERFALL', 'LAVA', 'STARS', 'NIGHT', 'MOON', 'CLOUD', 'WIND', 'COLD', 'STEAM'] },
    { name: 'Fishing Village', words: ['HARBOR', 'BOAT', 'NET', 'FISH', 'COD', 'HERRING', 'WHALE', 'PUFFIN', 'SEAL', 'LIGHTHOUSE', 'COTTAGE', 'WOOL', 'SWEATER', 'STORM', 'ROPE', 'ANCHOR'] },
    { name: 'Hot Springs', words: ['SPRING', 'STEAM', 'POOL', 'GEYSER', 'LAGOON', 'MUD', 'ROCK', 'TOWEL', 'BATH', 'MINERAL', 'CLOUD', 'SNOW', 'HEAT', 'BUBBLE', 'MOSS', 'VAPOR'] },
    { name: 'Black Sand Beach', words: ['SAND', 'WAVE', 'CLIFF', 'BASALT', 'PUFFIN', 'ROCK', 'TIDE', 'WIND', 'STORM', 'GULL', 'SHELL', 'PEBBLE', 'SEAWEED', 'CAVE', 'ARCH', 'FOAM'] },
  ],
  // 19 Scotland Highlands
  [
    { name: 'Highlands', words: ['CASTLE', 'LOCH', 'GLEN', 'MOOR', 'HEATHER', 'THISTLE', 'HILL', 'MIST', 'STAG', 'DEER', 'EAGLE', 'SHEEP', 'CLIFF', 'VALLEY', 'STREAM', 'BRIDGE'] },
    { name: 'Highland Games', words: ['BAGPIPE', 'KILT', 'TARTAN', 'DRUM', 'DANCE', 'FIDDLE', 'CABER', 'HAMMER', 'ROPE', 'RACE', 'PIPER', 'SHORTBREAD', 'PORRIDGE', 'OATS', 'SCONE', 'TEA'] },
    { name: 'Castle Life', words: ['CASTLE', 'TOWER', 'KNIGHT', 'BANNER', 'HALL', 'TORCH', 'GATE', 'MOAT', 'SHIELD', 'STAIRS', 'FEAST', 'HARP', 'LANTERN', 'TAPESTRY', 'KITCHEN', 'WELL'] },
    { name: 'Highland Farm', words: ['SHEEP', 'COW', 'COLLIE', 'STONE', 'WALL', 'GATE', 'BARN', 'HAY', 'TRACTOR', 'RAIN', 'FIELD', 'WOOL', 'TWEED', 'CROFT', 'MEADOW', 'PONY'] },
  ],
  // 20 Antarctica
  [
    { name: 'Frozen South', words: ['PENGUIN', 'SEAL', 'WHALE', 'ICEBERG', 'GLACIER', 'SNOW', 'ICE', 'BLIZZARD', 'KRILL', 'ALBATROSS', 'PETREL', 'SLED', 'TENT', 'EXPLORER', 'COMPASS', 'IGLOO'] },
    { name: 'Polar Station', words: ['STATION', 'SCIENTIST', 'RESEARCH', 'RADIO', 'SATELLITE', 'TELESCOPE', 'WEATHER', 'BALLOON', 'THERMOMETER', 'ROVER', 'LABORATORY', 'GENERATOR', 'PARKA', 'GOGGLES', 'HELMET', 'MAP'] },
    { name: 'Polar Wildlife', words: ['PENGUIN', 'SEAL', 'WHALE', 'ORCA', 'KRILL', 'ALBATROSS', 'PETREL', 'SQUID', 'FISH', 'TERN', 'FLOE', 'CHICK', 'EGG', 'NEST', 'ICE', 'SNOW'] },
    { name: 'Explorer Kit', words: ['TENT', 'SLED', 'ROPE', 'COMPASS', 'MAP', 'STOVE', 'PARKA', 'GLOVE', 'BOOT', 'GOGGLES', 'RADIO', 'LANTERN', 'SKI', 'TORCH', 'JOURNAL', 'KETTLE'] },
  ],
];
