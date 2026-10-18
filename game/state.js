// ==========================================
// STATE.JS - Campus Constants, Data & Game State
// ==========================================

export const PLAYER_SPEED = 0.13;
export const PLAYER_RADIUS = 0.6;
export const PICKUP_RADIUS_2D = 1.85;

// Room Centers & Boundaries (Each room is 26x22 units)
export const ROOM_CONFIG = {
  lobby: {
    id: 'lobby',
    name: 'Dataran Sekolah',
    badge: 'Lobi Utama',
    center: { x: 0, z: 0 },
    bounds: { minX: -13, maxX: 13, minZ: -11, maxZ: 11 },
    spawn: { x: 0, z: 4.5 }
  },
  room1: {
    id: 'room1',
    name: 'Bilik Darjah Bestari',
    badge: 'Bilik 1: Kuiz Jawi',
    center: { x: 100, z: 100 },
    bounds: { minX: 87, maxX: 113, minZ: 89, maxZ: 111 },
    spawn: { x: 100, z: 105.5 }
  },
  room2: {
    id: 'room2',
    name: 'Pusat Sumber (Perpustakaan)',
    badge: 'Bilik 2: Simpulan Bahasa Jawi',
    center: { x: 200, z: 200 },
    bounds: { minX: 187, maxX: 213, minZ: 189, maxZ: 211 },
    spawn: { x: 200, z: 205.5 }
  },
  room3: {
    id: 'room3',
    name: 'Bilik Seni Visual & Studio Khat',
    badge: 'Bilik 3: Seni Khat',
    center: { x: 300, z: 300 },
    bounds: { minX: 287, maxX: 313, minZ: 289, maxZ: 311 },
    spawn: { x: 300, z: 305.5 }
  }
};

// Input controls
export const keys = {
  w: false, a: false, s: false, d: false,
  ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
  e: false
};

// Student Profile
export const studentProfile = {
  name: 'Penjelajah Bestari',
  class: '3 Inovatif'
};

// Scoring & Attempts tracking
export const gameScores = {
  room1: 40,
  room2: 30,
  room3: 30,
  attemptsR1: 0,
  attemptsR2: 0,
  attemptsR3: 0,
  total() {
    return this.room1 + this.room2 + this.room3;
  }
};

// Global state container
export const gameState = {
  currentRoom: 'lobby',
  activeModal: null,
  nearbyTarget: null, // 'portalR1' | 'portalR2' | 'portalR3' | 'returnLobby' | 'tableR1' | 'tableR2' | 'tableR3' | 'npcTeacher'
  room1Completed: false,
  room2Completed: false,
  room3Completed: false,
  // Puzzle slot states
  puzzleR1Placed: [null, null, null, null],      // 'ga', 'wau', 'nun', 'alif'
  puzzleR2Placed: [null, null],                  // 'frag1' (اولت), 'frag2' (بوکو)
  // Room 3 Art Studio Calligraphy Customization State (SP 4.4.2)
  artworkR3: {
    bg: 'batik',       // 'batik' | 'songket' | 'vellum'
    textColor: 'gold',  // 'black' | 'gold' | 'indigo'
    frame: 'wood'      // 'wood' | 'gold' | 'minimal'
  }
};

// Correct answer configurations
export const PUZZLE_R1_CORRECT = ['ga', 'wau', 'nun', 'alif'];
export const PUZZLE_R2_CORRECT = ['frag1', 'frag2']; // RTL: Slot 0 (Kanan) = frag1 (اولت), Slot 1 (Kiri) = frag2 (بوکو)

// Collectibles for Room 1 (Bilik Darjah - Jawi 'GUNA')
export const COLLECTIBLES_R1 = [
  {
    id: 'ga',
    char: 'ݢ',
    name: 'Ga',
    rumi: 'G',
    color: 0x2EC4B6,
    pos: { x: 94.5, y: 1.6, z: 94.8 }, // Front ledge of Teacher's desk
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'wau',
    char: 'و',
    name: 'Wau',
    rumi: 'U',
    color: 0x9D4EDD,
    pos: { x: 103.2, y: 1.4, z: 97.0 }, // Aisle edge of Desk 2 (Front row)
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'nun',
    char: 'ن',
    name: 'Nun',
    rumi: 'N',
    color: 0xFF9F1C,
    pos: { x: 94.0, y: 1.4, z: 103.5 }, // Clear aisle facing Classroom Bookshelf
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'alif',
    char: 'ا',
    name: 'Alif',
    rumi: 'A',
    color: 0xFF5C8A,
    pos: { x: 103.2, y: 1.4, z: 101.5 }, // Aisle edge of Desk 4 (Middle row)
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];

// Collectibles for Room 2 (Pusat Sumber - Kad Simpulan Bahasa Jawi)
export const COLLECTIBLES_R2 = [
  {
    id: 'frag1',
    char: 'اولت',
    name: 'Ulat',
    rumi: 'Ulat',
    role: 'Perkataan Pertama',
    color: 0x3B82F6,
    pos: { x: 194.0, y: 1.5, z: 194.5 }, // Library aisle near bookshelf
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'frag2',
    char: 'بوکو',
    name: 'Buku',
    rumi: 'Buku',
    role: 'Perkataan Kedua',
    color: 0x8B5CF6,
    pos: { x: 204.6, y: 1.5, z: 196.0 }, // Near reading nook & counter
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];

// Collectibles for Room 3 (Bilik Seni Visual - Alatan Seni Khat Jawi)
export const COLLECTIBLES_R3 = [
  {
    id: 'orb1',
    label: 'Berus Khat',
    name: 'Berus Khat',
    topic: 'Alatan Seni Khat',
    desc: 'Berus buluh kaligrafi bermutu tinggi untuk melukis aksara Jawi yang gemalai.',
    char: '🖌️',
    color: 0xD97706,
    pos: { x: 294.0, y: 1.3, z: 295.0 }, // Near wooden easel
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'orb2',
    label: 'Palet Warna',
    name: 'Palet Warna',
    topic: 'Alatan Seni Khat',
    desc: 'Palet pembancuh cat air dan pigmen emas untuk seni hiasan kaligrafi.',
    char: '🎨',
    color: 0xEC4899,
    pos: { x: 305.5, y: 1.3, z: 296.0 }, // By art studio supply table
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'orb3',
    label: 'Kanvas Lukisan',
    name: 'Kanvas Lukisan',
    topic: 'Alatan Seni Khat',
    desc: 'Kanvas dan kertas kraf bertekstur untuk karya seni tulisan Jawi terpuji.',
    char: '📜',
    color: 0x3B82F6,
    pos: { x: 295.0, y: 1.3, z: 304.0 }, // Near studio exhibition area
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];
