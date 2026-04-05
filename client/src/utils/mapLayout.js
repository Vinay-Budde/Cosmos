export const TILE_SIZE = 32;
export const MAP_WIDTH  = 80;
export const MAP_HEIGHT = 60;

// Tile type constants
export const T = {
  BEIGE:    0,  // Center open area
  TREE:     1,  // Outer border
  BROWN:    2,  // Private rooms / Right desk grid
  GREEN:    3,  // Lecture hall / classroom
  DARK:     4,  // Discussion rooms
  RECEP:    5,  // Reception strip
  CORRIDOR: 6,  // Corridors
  WALL:     7,  // Opaque wall
  DOOR:     8,  // Open doorway
  DESK:     9,
  MONITOR:  10,
  CHAIR:    11,
  PLANT:    12,
  COUCH:    13,
  WHITEBOARD:14,
  ROUND_TABLE:15,
  RECEP_DESK:16,
  ARCADE:   17,
};

const createMap = () => {
  // Initialize with BEIGE
  const map = Array.from({ length: MAP_HEIGHT }, () =>
    Array(MAP_WIDTH).fill(T.BEIGE)
  );

  const set   = (x, y, type) => { if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) map[y][x] = type; };
  const fill  = (x1, y1, x2, y2, type) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) set(x, y, type); };
  const hwall = (x1, x2, y)  => { for (let x = x1; x <= x2; x++) set(x, y, T.WALL); };
  const vwall = (y1, y2, x)  => { for (let y = y1; y <= y2; y++) set(x, y, T.WALL); };

  // ══════════════════════════════════════════════
  // 1.  TREE BORDER — 3 tiles on all 4 sides
  // ══════════════════════════════════════════════
  fill(0, 0, 79, 2,  T.TREE);   // top
  fill(0, 57, 79, 59, T.TREE);  // bottom
  fill(0, 0, 2, 59,  T.TREE);   // left
  fill(77, 0, 79, 59, T.TREE);  // right

  // ══════════════════════════════════════════════
  // 2.  RECEPTION STRIP — row 3..5, cols 3..76
  // ══════════════════════════════════════════════
  fill(3, 3, 76, 5, T.RECEP);
  // Reception desk centered
  fill(33, 4, 45, 4, T.RECEP_DESK);
  // Plants flanking reception
  set(10,4,T.PLANT); set(11,4,T.PLANT);
  set(67,4,T.PLANT); set(68,4,T.PLANT);

  // ══════════════════════════════════════════════
  // 3.  LEFT COLUMN — 6 private rooms, cols 3..17
  //     Each room: 8 rows tall, rows 6..55
  //     Bottom corridor row 56
  // ══════════════════════════════════════════════
  const ROOM_X1 = 3, ROOM_X2 = 17;

  const rooms = [
    { y1: 6,  y2: 13, label: 'Room 1' },
    { y1: 14, y2: 21, label: 'Room 2' },
    { y1: 22, y2: 29, label: 'Room 3' },
    { y1: 30, y2: 37, label: 'Room 4' },
    { y1: 38, y2: 45, label: 'Room 5' },
    { y1: 46, y2: 55, label: 'Room 6' },
  ];

  rooms.forEach(({ y1, y2 }) => {
    // Floor
    fill(ROOM_X1, y1, ROOM_X2, y2, T.BROWN);
    // Walls
    hwall(ROOM_X1, ROOM_X2, y1);
    hwall(ROOM_X1, ROOM_X2, y2);
    vwall(y1, y2, ROOM_X1);
    vwall(y1, y2, ROOM_X2);
    // Door on right wall (middle)
    const mid = Math.floor((y1 + y2) / 2);
    set(ROOM_X2, mid, T.DOOR);
    // 2 desks facing each other
    const cy = Math.floor((y1 + y2) / 2);
    // Desk 1 (left side)
    set(ROOM_X1+2, cy-2, T.DESK);
    set(ROOM_X1+3, cy-2, T.MONITOR);
    set(ROOM_X1+2, cy-1, T.CHAIR);
    // Desk 2 (right side, facing left)
    set(ROOM_X2-4, cy+1, T.DESK);
    set(ROOM_X2-5, cy+1, T.MONITOR);
    set(ROOM_X2-4, cy+2, T.CHAIR);
    // Corner plant
    set(ROOM_X2-2, y1+1, T.PLANT);
  });

  // Left column corridor (col 18)
  fill(18, 6, 18, 55, T.CORRIDOR);

  // ══════════════════════════════════════════════
  // 4.  CENTER COLUMN — open co-working
  //     cols 19..48, rows 6..55
  // ══════════════════════════════════════════════
  fill(19, 6, 48, 55, T.BEIGE);

  // Lounge corner (top-left of center)
  set(20,7,T.COUCH); set(21,7,T.COUCH); set(22,7,T.COUCH);
  set(20,8,T.ROUND_TABLE);
  set(19,8,T.PLANT); set(23,7,T.PLANT); set(24,6,T.PLANT);

  // Scattered desks — organic placement (25 desks)
  const cwDesks = [
    [21,11],[24,11],[27,11],[31,11],[35,11],[39,11],[43,11],[46,11],
    [21,16],[25,16],[29,16],[33,16],[37,16],[41,16],[45,16],
    [20,21],[23,21],[27,21],[31,21],[35,21],[39,21],[43,21],[47,21],
    [21,26],[25,26],[29,26],[33,26],[38,26],[42,26],[46,26],
    [20,31],[24,31],[28,31],[32,31],[36,31],[40,31],[44,31],[47,31],
    [21,36],[25,36],[29,36],[33,36],[38,36],[42,36],[46,36],
    [20,41],[24,41],[28,41],[32,41],[36,41],[40,41],[44,41],[47,41],
    [21,46],[25,46],[29,46],[34,46],[38,46],[42,46],
    [21,51],[25,51],[29,51],[33,51],[37,51],[41,51],[45,51],
  ];
  cwDesks.forEach(([x, y]) => {
    if (x < 48 && y < 55) {
      set(x,   y, T.DESK);
      set(x+1, y, T.MONITOR);
      set(x,   y+1, T.CHAIR);
    }
  });

  // Center → right corridor (col 49)
  fill(49, 6, 49, 55, T.CORRIDOR);

  // ══════════════════════════════════════════════
  // 5.  RIGHT TOP — Open desk grid
  //     cols 50..76, rows 6..24
  // ══════════════════════════════════════════════
  fill(50, 6, 76, 24, T.BROWN);
  // 5 rows × 6 cols of desks
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 6; col++) {
      const dx = 52 + col * 4;
      const dy = 8  + row * 3;
      set(dx,   dy, T.DESK);
      set(dx+1, dy, T.MONITOR);
      set(dx,   dy+1, T.CHAIR);
    }
  }
  // Gaming area — top-right corner cols 71-76, rows 6-14
  fill(71, 6, 76, 14, T.BROWN);
  set(72,7,T.ARCADE); set(73,7,T.ARCADE);
  set(72,10,T.COUCH); set(73,10,T.COUCH);
  set(71,7,T.PLANT);  set(75,8,T.PLANT);
  // Wall between desk grid and gaming
  vwall(6, 14, 70);
  set(70, 10, T.DOOR);

  // ══════════════════════════════════════════════
  // 6.  RIGHT MID — Lecture Hall / Classroom
  //     cols 50..76, rows 25..39
  // ══════════════════════════════════════════════
  fill(50, 25, 76, 39, T.GREEN);
  hwall(50, 76, 25);
  hwall(50, 76, 39);
  vwall(25, 39, 76);
  // Left wall (col 50) kept open – corridor connects
  set(50, 32, T.DOOR);
  // Whiteboard on left
  set(51,27,T.WHITEBOARD); set(52,27,T.WHITEBOARD); set(53,27,T.WHITEBOARD); set(54,27,T.WHITEBOARD);
  // 6 rows × 8 cols of chairs, facing left
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 8; col++) {
      set(56 + col*2, 28 + row*2, T.CHAIR);
    }
  }

  // ══════════════════════════════════════════════
  // 7.  RIGHT BOTTOM — 6 Discussion Rooms
  //     cols 50..76, rows 40..55
  //     2 rows × 3 cols grid
  // ══════════════════════════════════════════════
  const discRooms = [
    [50,40,57,47], [58,40,65,47], [66,40,76,47],
    [50,48,57,55], [58,48,65,55], [66,48,76,55],
  ];
  discRooms.forEach(([x1,y1,x2,y2]) => {
    fill(x1,y1,x2,y2, T.DARK);
    hwall(x1,x2,y1); hwall(x1,x2,y2);
    vwall(y1,y2,x1); vwall(y1,y2,x2);
    // Door on top wall
    const mx = Math.floor((x1+x2)/2);
    set(mx, y1, T.DOOR);
    // Round table + 4 chairs
    const cx = Math.floor((x1+x2)/2);
    const cy = Math.floor((y1+y2)/2);
    set(cx,   cy,   T.ROUND_TABLE);
    set(cx-1, cy,   T.CHAIR);
    set(cx+1, cy,   T.CHAIR);
    set(cx,   cy-1, T.CHAIR);
    set(cx,   cy+1, T.CHAIR);
  });

  // Bottom corridor row 56
  fill(3, 56, 76, 56, T.CORRIDOR);

  return map;
};

export const MAP   = createMap();

export const ROOMS = [
  { id: 'Reception',         x1: 3,  y1: 3,  x2: 76, y2: 5  },
  { id: 'Room 1',            x1: 3,  y1: 6,  x2: 17, y2: 13 },
  { id: 'Room 2',            x1: 3,  y1: 14, x2: 17, y2: 21 },
  { id: 'Room 3',            x1: 3,  y1: 22, x2: 17, y2: 29 },
  { id: 'Room 4',            x1: 3,  y1: 30, x2: 17, y2: 37 },
  { id: 'Room 5',            x1: 3,  y1: 38, x2: 17, y2: 45 },
  { id: 'Room 6',            x1: 3,  y1: 46, x2: 17, y2: 55 },
  { id: 'Co-Working Space',  x1: 19, y1: 6,  x2: 48, y2: 55 },
  { id: 'Open Plan Office',  x1: 50, y1: 6,  x2: 76, y2: 24 },
  { id: 'Gaming Area',       x1: 71, y1: 6,  x2: 76, y2: 14 },
  { id: 'Lecture Hall',      x1: 50, y1: 25, x2: 76, y2: 39 },
  { id: 'Discussion Room 1', x1: 50, y1: 40, x2: 57, y2: 47 },
  { id: 'Discussion Room 2', x1: 58, y1: 40, x2: 65, y2: 47 },
  { id: 'Discussion Room 3', x1: 66, y1: 40, x2: 76, y2: 47 },
  { id: 'Discussion Room 4', x1: 50, y1: 48, x2: 57, y2: 55 },
  { id: 'Discussion Room 5', x1: 58, y1: 48, x2: 65, y2: 55 },
  { id: 'Discussion Room 6', x1: 66, y1: 48, x2: 76, y2: 55 },
];
