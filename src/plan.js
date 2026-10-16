// House plan data, in meters.
// Plan coordinates: x grows east, z grows south (north is -z). Origin = the
// outer north-west corner of the house (west face of the party wall, north
// face of the living-room wall). Values were measured from the architect's
// 1:50 vector drawings; the upper floor sheet is aligned to the ground floor
// sheet by its stacked exterior walls.

export const LEVELS = {
  ground: 0,
  groundCeiling: 2.85,
  upper: 3.25,
  upperCeiling: 5.9,
  roof: 6.15,
  roofParapet: 6.4,
  terraceParapet: 3.88,
  enclosureTop: 7.63,
  outside: -0.2,
  courtyard: -0.04,
  lawn: -0.26,
};

// ---------------------------------------------------------------------------
// Walls: [x0, z0, x1, z1]
// ---------------------------------------------------------------------------
export const WALLS = {
  ground: [
    // party wall (shared with the neighbouring unit), house part
    [-0.03, 0.0, 0.177, 8.483],
    // north facade (living room window between 2.029 and 4.525)
    [0.177, 0.0, 2.029, 0.202],
    [4.525, 0.0, 5.672, 0.202],
    // living room east facade (sliding door 1.053 .. 3.448)
    [5.469, 0.202, 5.672, 1.053],
    [5.672, 0.647, 5.923, 1.053],
    [5.469, 3.448, 5.923, 3.849],
    [5.469, 3.849, 5.672, 4.299],
    // foyer north + east (front door 4.673 .. 5.970)
    [5.469, 4.299, 6.329, 4.506],
    [6.122, 4.506, 6.329, 4.673],
    [6.122, 5.97, 6.329, 6.283],
    // stair core north + east (utility doors 6.486 .. 7.981)
    [6.329, 6.08, 10.227, 6.283],
    [10.024, 6.283, 10.227, 6.486],
    [10.024, 7.981, 10.227, 8.179],
    // core south / bedroom wing north
    [6.201, 8.281, 10.024, 8.483],
    [10.024, 8.179, 11.078, 8.483],
    // kitchen south wall (window 0.226 .. 1.121) and pocket-door wall
    [0.177, 8.281, 0.226, 8.483],
    [1.121, 8.281, 4.455, 8.483],
    [4.455, 8.281, 5.169, 8.483],
    // pantry back wall
    [5.094, 5.97, 5.169, 7.637],
    // stair divider + guest WC
    [6.32, 7.284, 6.426, 7.385],
    [6.32, 8.179, 6.426, 8.281],
    // master bedroom west wall
    [1.174, 8.281, 1.377, 12.002],
    // south facade
    [1.377, 11.8, 2.739, 12.002],
    [4.239, 11.8, 5.478, 12.002],
    [6.373, 11.8, 7.471, 12.002],
    // safe room (ממ"ד) – reinforced concrete
    [7.471, 8.483, 7.678, 8.633],
    [7.471, 9.427, 7.678, 12.002],
    [7.678, 11.703, 8.679, 12.002],
    [9.671, 11.703, 10.774, 12.002],
    [10.774, 8.483, 11.078, 12.002],
    // master bathroom
    [4.869, 9.701, 5.575, 9.855],
    [4.869, 9.855, 4.971, 11.8],
    [6.267, 9.701, 7.471, 9.855],
  ],
  upper: [
    [4.472, 6.079, 10.227, 6.282], // core north
    [4.472, 6.282, 4.675, 8.483], // laundry west (future terrace door closed with gypsum)
    [10.024, 6.282, 10.227, 6.533], // core east (stair window 6.533 .. 7.129)
    [10.024, 7.129, 10.227, 8.483],
    [6.871, 6.282, 6.973, 7.283], // stair guard wall
    [1.121, 8.28, 4.472, 8.483], // playroom north
    [6.871, 8.28, 10.024, 8.483], // bedroom north
    [10.024, 8.178, 11.078, 8.483],
    [1.174, 8.483, 1.377, 11.702], // playroom west
    [4.574, 8.483, 4.675, 8.602], // playroom east (door 8.602 .. 9.395)
    [4.574, 9.395, 4.675, 11.702],
    [1.377, 11.499, 2.272, 11.702], // playroom south (window 2.272 .. 3.471)
    [3.471, 11.499, 4.574, 11.702],
    [4.472, 11.702, 4.675, 12.002],
    [4.675, 9.92, 5.676, 10.022], // bathroom north (door 5.676 .. 6.496)
    [6.496, 9.92, 7.471, 10.022],
    [7.471, 8.483, 7.577, 8.707], // bedroom west (door 8.707 .. 9.506)
    [7.471, 9.506, 7.577, 11.799],
    [4.675, 11.799, 5.478, 12.002], // south facade
    [6.373, 11.799, 8.578, 12.002],
    [9.773, 11.799, 10.871, 12.002],
    [10.871, 8.483, 11.078, 12.002], // east facade
  ],
};

// Partition between the guest WC and the boiler closet; it stops under the
// sloped soffit of the second stair flight. [x0, z0, x1, z1, top]
export const LOW_WALLS = { ground: [[8.371, 7.284, 8.525, 8.281, 1.99]] };

// The wall between the two stair flights rises above the upper floor as a guard.
export const STAIR_DIVIDER = [6.32, 7.178, 9.138, 7.284];

// ---------------------------------------------------------------------------
// Rooms. `rects` must not overlap within a floor (they also drive floor
// finishes). `floor` and `wall` pick finishes from materials.js.
// ---------------------------------------------------------------------------
export const ROOMS = {
  ground: [
    { id: 'living', he: 'סלון', en: 'Living room', floor: 'porcelain', wall: 'paint',
      rects: [[0.177, 0.202, 5.469, 4.506]], label: [2.4, 2.4] },
    { id: 'kitchen', he: 'מטבח', en: 'Kitchen', floor: 'porcelain', wall: 'paint',
      rects: [[0.177, 4.506, 4.32, 8.281]], label: [2.0, 7.0] },
    { id: 'foyer', he: 'כניסה', en: 'Entrance', floor: 'porcelain', wall: 'paint',
      rects: [[4.32, 4.506, 6.122, 5.97]], label: [5.25, 5.25] },
    { id: 'pantry', he: 'מזווה', en: 'Pantry', floor: 'porcelain', wall: 'paint', hidden: true,
      rects: [[4.32, 5.97, 5.169, 8.281]] },
    { id: 'hall', he: 'מבואה', en: 'Hall', floor: 'porcelain', wall: 'paint', hidden: true,
      rects: [[5.169, 5.97, 6.122, 8.281], [6.122, 6.283, 6.32, 8.281]] },
    { id: 'stair', he: 'מדרגות', en: 'Stairs', floor: 'porcelain', wall: 'paint',
      rects: [[6.32, 6.283, 10.024, 7.178], [9.138, 7.178, 10.024, 7.284]], label: [7.6, 6.7] },
    { id: 'wc', he: 'שירותי אורחים', en: 'Guest WC', floor: 'bathTile', wall: 'bathWall',
      rects: [[6.426, 7.284, 8.371, 8.281]], label: [7.4, 7.8] },
    { id: 'utility', he: 'חדר טכני', en: 'Utility', floor: 'concrete', wall: 'paint', hidden: true,
      rects: [[8.525, 7.284, 10.024, 8.281]] },
    { id: 'corridor', he: 'מסדרון', en: 'Corridor', floor: 'oak', wall: 'paint', hidden: true,
      rects: [[4.869, 8.483, 7.471, 9.701]] },
    { id: 'master', he: 'חדר הורים', en: 'Master bedroom', floor: 'oak', wall: 'paint',
      rects: [[1.377, 8.483, 4.869, 11.8]], label: [3.1, 10.1] },
    { id: 'masterBath', he: 'מקלחת הורים', en: 'Master bath', floor: 'bathTile', wall: 'bathWall',
      rects: [[4.971, 9.855, 7.471, 11.8]], label: [6.2, 10.6] },
    { id: 'mamad', he: 'ממ״ד', en: 'Safe room', floor: 'oak', wall: 'paint',
      rects: [[7.678, 8.483, 10.774, 11.703]], label: [9.2, 9.9] },
  ],
  upper: [
    { id: 'upperHall', he: 'מבואה ופינת כביסה', en: 'Hall & laundry', floor: 'porcelain', wall: 'paint',
      rects: [[4.675, 6.282, 6.871, 8.483], [6.871, 7.283, 7.151, 8.28]], label: [5.7, 7.6] },
    { id: 'upperStair', he: 'חלל מדרגות', en: 'Stairwell', floor: null, wall: 'paint', hidden: true,
      rects: [[6.973, 6.282, 10.024, 7.283], [7.151, 7.283, 10.024, 8.28]] },
    { id: 'upperCorridor', he: 'מסדרון', en: 'Corridor', floor: 'porcelain', wall: 'paint', hidden: true,
      rects: [[4.675, 8.483, 7.471, 9.92]] },
    { id: 'playroom', he: 'חדר משחקים', en: 'Playroom', floor: 'oak', wall: 'paint',
      rects: [[1.377, 8.483, 4.574, 11.499]], label: [3.0, 9.9] },
    { id: 'upperBath', he: 'חדר רחצה', en: 'Bathroom', floor: 'bathTile', wall: 'bathWall',
      rects: [[4.675, 10.022, 7.471, 11.799]], label: [5.9, 10.8] },
    { id: 'bedroom', he: 'חדר שינה', en: 'Bedroom', floor: 'oak', wall: 'paint',
      rects: [[7.577, 8.483, 10.871, 11.799]], label: [9.2, 9.8] },
  ],
};

// ---------------------------------------------------------------------------
// Openings. `rect` is the opening's footprint inside the wall line.
// sill / head are relative to the floor level of that storey.
// ---------------------------------------------------------------------------
export const WINDOWS = [
  // ground floor
  { floor: 'ground', rect: [2.029, 0.0, 4.525, 0.202], sill: 0.6, head: 2.2, kind: 'slider', panes: 2 },
  { floor: 'ground', rect: [5.469, 1.053, 5.923, 3.448], sill: 0.0, head: 2.5, kind: 'slider', panes: 2, door: true, open: true, depth: [5.469, 5.672] },
  { floor: 'ground', rect: [0.226, 8.281, 1.121, 8.483], sill: 1.05, head: 2.2, kind: 'casement', panes: 1 },
  { floor: 'ground', rect: [2.739, 11.8, 4.239, 12.002], sill: 1.0, head: 2.2, kind: 'slider', panes: 2, shutter: 0.25 },
  { floor: 'ground', rect: [5.478, 11.8, 6.373, 12.002], sill: 1.4, head: 2.2, kind: 'casement', panes: 1, frosted: true },
  { floor: 'ground', rect: [8.679, 11.703, 9.671, 12.002], sill: 1.0, head: 2.1, kind: 'mamad', panes: 1 },
  // upper floor
  { floor: 'upper', rect: [2.272, 11.499, 3.471, 11.702], sill: 0.9, head: 2.1, kind: 'slider', panes: 2, shutter: 0.2 },
  { floor: 'upper', rect: [5.478, 11.799, 6.373, 12.002], sill: 1.4, head: 2.1, kind: 'casement', panes: 1, frosted: true },
  { floor: 'upper', rect: [8.578, 11.799, 9.773, 12.002], sill: 0.9, head: 2.1, kind: 'slider', panes: 2, shutter: 0.3 },
  { floor: 'upper', rect: [10.024, 6.533, 10.227, 7.129], sill: 0.3, head: 2.1, kind: 'fixed', panes: 1 },
];

// Doors. hinge = [x, z] at the jamb; `closed` = unit direction of the leaf
// when closed (along the wall); `open` = direction of the leaf when open.
export const DOORS = [
  { id: 'entry', floor: 'ground', rect: [6.122, 4.673, 6.329, 5.97], head: 2.25, kind: 'entry',
    hinge: [6.16, 4.673], closed: [0, 1], open: [-1, 0.25], width: 0.95, openAngle: 1.0 },
  { id: 'utility', floor: 'ground', rect: [10.024, 6.486, 10.227, 7.981], head: 2.0, kind: 'double',
    hinge: [10.227, 6.486], closed: [0, 1], width: 0.747 },
  { id: 'wc', floor: 'ground', rect: [6.32, 7.385, 6.426, 8.179], head: 2.1, kind: 'interior',
    hinge: [6.373, 8.179], closed: [0, -1], open: [1, 0], width: 0.79 },
  { id: 'masterBath', floor: 'ground', rect: [5.575, 9.701, 6.267, 9.855], head: 2.1, kind: 'interior',
    hinge: [6.267, 9.778], closed: [-1, 0], open: [0, 1], width: 0.69 },
  { id: 'mamad', floor: 'ground', rect: [7.471, 8.633, 7.678, 9.427], head: 2.0, kind: 'mamad',
    hinge: [7.471, 8.633], closed: [0, 1], open: [-1, 0.15], width: 0.794 },
  { id: 'slide', floor: 'ground', rect: [5.169, 8.281, 6.201, 8.483], head: 2.1, kind: 'pocket',
    width: 1.06 },
  { id: 'playroom', floor: 'upper', rect: [4.574, 8.602, 4.675, 9.395], head: 2.1, kind: 'interior',
    hinge: [4.624, 8.602], closed: [0, 1], open: [-1, 0], width: 0.79 },
  { id: 'upperBath', floor: 'upper', rect: [5.676, 9.92, 6.496, 10.022], head: 2.1, kind: 'interior',
    hinge: [5.676, 9.971], closed: [1, 0], open: [0, 1], width: 0.82 },
  { id: 'bedroom', floor: 'upper', rect: [7.471, 8.707, 7.577, 9.506], head: 2.1, kind: 'interior',
    hinge: [7.524, 8.707], closed: [0, 1], open: [1, 0], width: 0.8 },
];

// ---------------------------------------------------------------------------
// Slabs (structural) – rect lists.
// ---------------------------------------------------------------------------
export const SLABS = {
  // roof of the ground-floor living wing = the terrace
  terrace: [
    [-0.03, 0.0, 5.672, 4.506],
    [5.672, 0.647, 5.923, 3.849],
    [5.672, 4.299, 6.329, 6.079],
    [-0.03, 4.506, 5.672, 6.079],
    [-0.03, 6.079, 4.472, 8.28],
    [-0.03, 8.28, 1.121, 8.483],
  ],
  // floor of the upper storey (with the stair void left out)
  upper: [
    [1.121, 8.28, 11.078, 12.002],
    [4.472, 6.079, 6.973, 8.28],
    [6.973, 7.283, 7.151, 8.28],
    [10.024, 6.079, 10.227, 8.28],
    [6.973, 6.079, 10.024, 6.282],
  ],
  roof: [
    [1.121, 8.28, 4.574, 11.702],
    [4.472, 8.28, 11.078, 12.002],
    [4.472, 6.079, 10.227, 8.28],
  ],
  ground: [
    [-0.03, 0.0, 5.923, 8.483],
    [5.923, 4.299, 10.227, 8.483],
    [1.174, 8.483, 11.078, 12.002],
    [10.227, 8.179, 11.078, 8.483],
  ],
};

export const PARAPETS = {
  terrace: [
    [-0.03, 0.0, 5.672, 0.202],
    [-0.03, 0.202, 0.177, 8.483],
    [5.469, 0.202, 5.672, 4.299],
    [5.469, 4.299, 6.329, 4.506],
    [6.122, 4.506, 6.329, 6.079],
    [0.177, 8.28, 1.121, 8.483],
  ],
  roof: [
    [4.472, 6.079, 10.227, 6.282],
    [10.024, 6.282, 10.227, 8.178],
    [10.227, 8.178, 11.078, 8.381],
    [10.871, 8.381, 11.078, 12.002],
    [4.472, 11.8, 10.871, 12.002],
    [1.121, 11.499, 4.574, 11.702],
    [1.121, 8.28, 1.377, 11.499],
    [1.377, 8.28, 4.472, 8.483],
    [4.472, 6.282, 4.675, 8.28],
  ],
  // low stone band on the strip in front of the playroom
  ledge: [[1.121, 11.9, 4.472, 12.002]],
};

// Roof enclosure for the solar water heater and AC condensers.
export const ENCLOSURE = { x0: 6.33, z0: 6.079, x1: 9.95, z1: 9.6, t: 0.15 };

// ---------------------------------------------------------------------------
// Stair geometry (U-shaped, 19 risers, landing over the utility closet)
// ---------------------------------------------------------------------------
export const STAIR = {
  risers: 19,
  rise: 3.25 / 19,
  flight1: { x0: 6.32, x1: 9.138, z0: 6.283, z1: 7.178, steps: 10 },
  landing: { x0: 9.138, x1: 10.024, z0: 6.283, z1: 8.281 },
  flight2: { x0: 7.151, x1: 9.138, z0: 7.284, z1: 8.281, steps: 7 },
};

// Courtyard, pergola and lot.
export const SITE = {
  lot: { x0: -0.03, z0: -4.6, x1: 12.75, z1: 15.6 },
  courtyard: { x0: 5.923, z0: 0.0, x1: 9.68, z1: 6.08 },
  pergola: { x0: 5.8, z0: 0.06, x1: 9.13, z1: 6.08, top: 3.05, beams: [1.15, 2.45, 3.72, 5.03] },
  path: { x0: 11.08, z0: -4.6, x1: 12.75, z1: 15.6 },
  sauna: { x0: 0.35, z0: -1.3, x1: 1.45, z1: -0.12, h: 1.9 },
};
