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
    badge: 'Bilik 2: Bina Ayat',
    center: { x: 200, z: 200 },
    bounds: { minX: 187, maxX: 213, minZ: 189, maxZ: 211 },
    spawn: { x: 200, z: 205.5 }
  },
  room3: {
    id: 'room3',
    name: 'Padang Sekolah & Kantin',
    badge: 'Bilik 3: Peribahasa',
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
  puzzleR2Placed: [null, null, null],            // 'frag1', 'frag2', 'frag3'
  quizR3Answers: { q1: null, q2: null }
};

// Correct answer configurations
export const PUZZLE_R1_CORRECT = ['ga', 'wau', 'nun', 'alif'];
export const PUZZLE_R2_CORRECT = ['frag1', 'frag2', 'frag3'];
export const QUIZ_R3_CORRECT = { q1: 'ulat_buku', q2: 'kaki_bangku' };

// Collectibles for Room 1 (Bilik Darjah - Jawi)
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

// Collectibles for Room 2 (Pusat Sumber - Frasa & Ayat)
export const COLLECTIBLES_R2 = [
  {
    id: 'frag1',
    role: 'Subjek / Frasa Nama',
    text: 'Murid-murid itu',
    char: '📖 1',
    color: 0x3B82F6,
    pos: { x: 194.0, y: 1.5, z: 194.2 }, // Accessible library aisle
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'frag2',
    role: 'Kata Kerja',
    text: 'sedang membaca',
    char: '📖 2',
    color: 0x8B5CF6,
    pos: { x: 204.6, y: 1.5, z: 195.2 }, // Front edge of Librarian counter
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'frag3',
    role: 'Objek / Keterangan',
    text: 'buku cerita di perpustakaan.',
    char: '📖 3',
    color: 0xEC4899,
    pos: { x: 194.0, y: 1.4, z: 203.2 }, // Reading nook
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];

// Collectibles for Room 3 (Padang & Kantin - Senario Peribahasa)
export const COLLECTIBLES_R3 = [
  {
    id: 'orb1',
    label: 'Senario 1',
    topic: 'Kecenderungan Membaca',
    proverb: 'ULAT BUKU',
    note: 'Nota Pintar #1: ULAT BUKU bermaksud orang yang sangat rajin dan gemar membaca buku.',
    char: '⚽ 1',
    color: 0x10B981,
    pos: { x: 293.0, y: 1.2, z: 300.0 }, // By football goalpost
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'orb2',
    label: 'Senario 2',
    topic: 'Aktiviti Sukan Bola',
    proverb: 'KAKI BANGKU',
    note: 'Nota Pintar #2: KAKI BANGKU bermaksud orang yang tidak pandai bermain bola sepak.',
    char: '⚽ 2',
    color: 0xF59E0B,
    pos: { x: 300.0, y: 1.4, z: 294.0 }, // In front of canteen
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'orb3',
    label: 'Senario 3',
    topic: 'Semangat Kesukanan',
    proverb: 'MANDI PELUH',
    note: 'Nota Pintar #3: MANDI PELUH bermaksud bekerja atau bersukan dengan bersungguh-sungguh.',
    char: '⚽ 3',
    color: 0x6366F1,
    pos: { x: 306.5, y: 1.2, z: 304.0 }, // Near spectators bench
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];
