// ==========================================
// STATE.JS - Campus Constants, Data & Game State (Jejak Jawi Bestari)
// ==========================================

export const PLAYER_SPEED = 0.13;
export const PLAYER_RADIUS = 0.6;
export const PICKUP_RADIUS_2D = 1.85;

// Room Centers & Boundaries (5-Area Campus Progression)
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
    name: 'Taman Pagar Sesat Jawi (Maze Huruf Alif-Ya)',
    badge: 'Bilik 1: Pagar Sesat Jawi',
    center: { x: 100, z: 100 },
    bounds: { minX: 82, maxX: 118, minZ: 84, maxZ: 116 },
    spawn: { x: 86.0, z: 112.0 }
  },
  room2: {
    id: 'room2',
    name: 'Makmal Kata Jawi (Ejaan 4 Pasangan Kata)',
    badge: 'Bilik 2: Makmal Kata',
    center: { x: 200, z: 200 },
    bounds: { minX: 187, maxX: 213, minZ: 189, maxZ: 211 },
    spawn: { x: 200.0, z: 205.5 }
  },
  room3: {
    id: 'room3',
    name: 'Arkib Simpulan Bahasa (Cantuman & Maksud)',
    badge: 'Bilik 3: Arkib Simpulan Bahasa',
    center: { x: 300, z: 300 },
    bounds: { minX: 287, maxX: 313, minZ: 289, maxZ: 311 },
    spawn: { x: 300.0, z: 305.5 }
  },
  room4: {
    id: 'room4',
    name: 'Studio Persembahan Seni Khat (Lukisan & Hiasan)',
    badge: 'Bilik 4: Studio Seni Khat',
    center: { x: 400, z: 400 },
    bounds: { minX: 387, maxX: 413, minZ: 389, maxZ: 411 },
    spawn: { x: 400.0, z: 405.5 }
  }
};

// Input controls
export const keys = {
  w: false, a: false, s: false, d: false,
  ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
  e: false
};

// Mobile Touch Virtual Joystick Vector
export const joystickVector = {
  x: 0,
  z: 0,
  active: false
};

// Student Profile
export const studentProfile = {
  name: 'Penjelajah Bestari',
  class: '4 Inovatif'
};

// Scoring & Attempts tracking (Room 2: 30, Room 3: 30, Room 4: 40 = 100 total; Room 1 is 100% exploration)
export const gameScores = {
  room1: 100, // Kembara Huruf Jawi (100% completed)
  room2: 30,  // Makmal Ejaan 4 Pasangan Kata (Max 30)
  room3: 30,  // Cantuman 4 Simpulan Bahasa (Max 30)
  room4: 40,  // Persembahan Seni Khat Jawi (Max 40)
  attemptsR1: 0,
  attemptsR2: 0,
  attemptsR3: 0,
  attemptsR4: 0,
  total() {
    return this.room2 + this.room3 + this.room4;
  }
};

// Global state container
export const gameState = {
  currentRoom: 'lobby',
  activeModal: 'intro-modal',
  nearbyTarget: null, // 'portalR1' | 'portalR2' | 'portalR3' | 'portalR4' | 'returnLobby' | 'tableR1' | 'tableR2' | 'tableR3' | 'tableR4' | 'npcTeacher'
  room1Completed: false,
  room2Completed: false,
  room3Completed: false,
  room4Completed: false,
  // Room 1: Sequential step tracker (1 to 10)
  currentR1Step: 1,
  // Room 2: 2-Session Batch System
  r2Session: 1, // 1: Ulat Buku & Anak Emas | 2: Buah Hati & Cahaya Mata
  r2Session1Completed: false,
  // Slot states
  puzzleR1Placed: [null, null, null, null],
  puzzleR2Placed: [null, null],
  puzzleR3Pairs: {},
  // Room 4 Calligraphy Customization State
  artworkR4: {
    bg: 'batik',       // 'batik' | 'songket' | 'vellum'
    textColor: 'gold',  // 'black' | 'gold' | 'indigo'
    frame: 'wood',     // 'wood' | 'gold' | 'minimal'
    selectedIdiom: 'ulat_buku'
  },
  // Backwards compatibility getter for artworkR3
  get artworkR3() {
    return this.artworkR4;
  }
};

// 4 Simpulan Bahasa Core Data
export const IDIOM_DATA = [
  {
    id: 'ulat_buku',
    idiom: 'Ulat Buku',
    jawi: 'اولت بوکو',
    words: ['ulat', 'buku'],
    jawiWords: ['اولت', 'بوکو'],
    meaning: 'Orang yang sangat gemar dan rajin membaca buku.'
  },
  {
    id: 'anak_emas',
    idiom: 'Anak Emas',
    jawi: 'انق امس',
    words: ['anak', 'emas'],
    jawiWords: ['انق', 'امس'],
    meaning: 'Anak yang sangat disayangi dan menjadi kesayangan ibu bapa.'
  },
  {
    id: 'buah_hati',
    idiom: 'Buah Hati',
    jawi: 'بواه هاتي',
    words: ['buah', 'hati'],
    jawiWords: ['بواه', 'هاتي'],
    meaning: 'Orang yang amat dikasihi atau kekasih tersayang.'
  },
  {
    id: 'cahaya_mata',
    idiom: 'Cahaya Mata',
    jawi: 'چهاي مات',
    words: ['cahaya', 'mata'],
    jawiWords: ['چهاي', 'مات'],
    meaning: 'Anak kandung yang menjadi penyeri dan penyejuk hati keluarga.'
  }
];

// Correct answer configurations
export const PUZZLE_R1_CORRECT = ['ga', 'wau', 'nun', 'alif']; // Backwards compatibility
export const PUZZLE_R2_CORRECT = ['ulat', 'buku']; // RTL: Slot 0 (Kanan) = ulat (اولت), Slot 1 (Kiri) = buku (بوکو)

// ==========================================
// 1. COLLECTIBLES ROOM 1 (Hedge Maze 10 Checkpoints: Alif to Ya/Nya)
// ==========================================
export const COLLECTIBLES_R1 = [
  {
    id: 'step1',
    stepIndex: 1,
    char: 'ا ب ت ث',
    name: 'Alif, Ba, Ta, Tsa',
    rumi: 'A, B, T, Ts',
    label: 'Pos 1: ا ب ت ث',
    letters: ['ا', 'ب', 'ت', 'ث'],
    color: 0x10B981,
    pos: { x: 86.0, y: 1.3, z: 104.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'step2',
    stepIndex: 2,
    char: 'ج چ ح خ',
    name: 'Jim, Cha, Ha, Kha',
    rumi: 'J, C, H, Kh',
    label: 'Pos 2: ج چ ح خ',
    letters: ['ج', 'چ', 'ح', 'خ'],
    color: 0x06D6A0,
    pos: { x: 92.0, y: 1.3, z: 104.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'step3',
    stepIndex: 3,
    char: 'د ذ ر ز',
    name: 'Dal, Dzal, Ra, Zai',
    rumi: 'D, Dz, R, Z',
    label: 'Pos 3: د ذ ر ز',
    letters: ['د', 'ذ', 'ر', 'ز'],
    color: 0x3B82F6,
    pos: { x: 92.0, y: 1.3, z: 94.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'step4',
    stepIndex: 4,
    char: 'س ش ص ض',
    name: 'Sin, Syin, Sod, Dhad',
    rumi: 'S, Sy, S, Dh',
    label: 'Pos 4: س ش ص ض',
    letters: ['س', 'ش', 'ص', 'ض'],
    color: 0x6366F1,
    pos: { x: 98.0, y: 1.3, z: 94.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'step5',
    stepIndex: 5,
    char: 'ط ظ ع غ',
    name: 'Tho, Dzo, Ain, Ghain',
    rumi: 'Th, Dz, A, Gh',
    label: 'Pos 5: ط ظ ع غ',
    letters: ['ط', 'ظ', 'ع', 'غ'],
    color: 0x8B5CF6,
    pos: { x: 98.0, y: 1.3, z: 106.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'step6',
    stepIndex: 6,
    char: 'ڠ ف ڤ ق',
    name: 'Nga, Fa, Pa, Qaf',
    rumi: 'Ng, F, P, Q',
    label: 'Pos 6: ڠ ف ڤ ق',
    letters: ['ڠ', 'ف', 'ڤ', 'ق'],
    color: 0xEC4899,
    pos: { x: 104.0, y: 1.3, z: 106.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'step7',
    stepIndex: 7,
    char: 'ک ݢ ل م',
    name: 'Kaf, Ga, Lam, Mim',
    rumi: 'K, G, L, M',
    label: 'Pos 7: ک ݢ ل م',
    letters: ['ک', 'ݢ', 'ل', 'م'],
    color: 0xF59E0B,
    pos: { x: 104.0, y: 1.3, z: 96.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'step8',
    stepIndex: 8,
    char: 'ن و ۏ',
    name: 'Nun, Wau, Va',
    rumi: 'N, W, V',
    label: 'Pos 8: ن و ۏ',
    letters: ['ن', 'و', 'ۏ'],
    color: 0xEF4444,
    pos: { x: 110.0, y: 1.3, z: 96.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'step9',
    stepIndex: 9,
    char: 'ه ء ي',
    name: 'Ha, Hamzah, Ya',
    rumi: 'H, Hamzah, Y',
    label: 'Pos 9: ه ء ي',
    letters: ['ه', 'ء', 'ي'],
    color: 0x14B8A6,
    pos: { x: 110.0, y: 1.3, z: 106.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'step10',
    stepIndex: 10,
    char: 'ى ڽ',
    name: 'Ye, Nya',
    rumi: 'Ye, Nya',
    label: 'Pos 10: ى ڽ',
    letters: ['ى', 'ڽ'],
    color: 0xF97316,
    pos: { x: 106.0, y: 1.3, z: 88.0 },
    mesh: null, gemMesh: null, ringMesh: null, beaconMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];

// ==========================================
// 2. COLLECTIBLES ROOM 2 (2-Session Batch System on 4 Special Pedestal Desks)
// Pedestals: [195, 196], [205, 196], [195, 202], [205, 202]
// ==========================================
export const COLLECTIBLES_R2_SESSION1 = [
  {
    id: 'ulat',
    session: 1,
    name: 'Ulat Bulu',
    rumi: 'Ulat',
    char: '🐛',
    jawi: 'اولت',
    letters: ['ا', 'و', 'ل', 'ت'],
    idiomGroup: 'ulat_buku',
    color: 0x10B981,
    desc: 'Ulat Bulu Hijau (اولت)',
    pos: { x: 195.0, y: 1.45, z: 196.0 },
    mesh: null, gemMesh: null, ringMesh: null, pointLight: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'buku',
    session: 1,
    name: 'Buku',
    rumi: 'Buku',
    char: '📖',
    jawi: 'بوکو',
    letters: ['ب', 'و', 'ک', 'و'],
    idiomGroup: 'ulat_buku',
    color: 0x3B82F6,
    desc: 'Buku Ilmu (بوکو)',
    pos: { x: 205.0, y: 1.45, z: 196.0 },
    mesh: null, gemMesh: null, ringMesh: null, pointLight: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'anak',
    session: 1,
    name: 'Anak / Bayi',
    rumi: 'Anak',
    char: '👶',
    jawi: 'انق',
    letters: ['ا', 'ن', 'ق'],
    idiomGroup: 'anak_emas',
    color: 0xF59E0B,
    desc: 'Anak / Bayi Comel (انق)',
    pos: { x: 195.0, y: 1.45, z: 202.0 },
    mesh: null, gemMesh: null, ringMesh: null, pointLight: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'emas',
    session: 1,
    name: 'Jongkong Emas',
    rumi: 'Emas',
    char: '🪙',
    jawi: 'امس',
    letters: ['ا', 'م', 'س'],
    idiomGroup: 'anak_emas',
    color: 0xEAB308,
    desc: 'Jongkong Emas Berharga (امس)',
    pos: { x: 205.0, y: 1.45, z: 202.0 },
    mesh: null, gemMesh: null, ringMesh: null, pointLight: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];

export const COLLECTIBLES_R2_SESSION2 = [
  {
    id: 'buah',
    session: 2,
    name: 'Buah Epal',
    rumi: 'Buah',
    char: '🍎',
    jawi: 'بواه',
    letters: ['ب', 'و', 'ا', 'ه'],
    idiomGroup: 'buah_hati',
    color: 0xEF4444,
    desc: 'Buah Epal Manis (بواه)',
    pos: { x: 195.0, y: 1.45, z: 196.0 },
    mesh: null, gemMesh: null, ringMesh: null, pointLight: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'hati',
    session: 2,
    name: 'Hati / Kasih',
    rumi: 'Hati',
    char: '💖',
    jawi: 'هاتي',
    letters: ['ه', 'ا', 'ت', 'ي'],
    idiomGroup: 'buah_hati',
    color: 0xEC4899,
    desc: 'Hati / Lambang Kasih (هاتي)',
    pos: { x: 205.0, y: 1.45, z: 196.0 },
    mesh: null, gemMesh: null, ringMesh: null, pointLight: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'cahaya',
    session: 2,
    name: 'Cahaya Suria',
    rumi: 'Cahaya',
    char: '☀️',
    jawi: 'چهاي',
    letters: ['چ', 'ه', 'ا', 'ي'],
    idiomGroup: 'cahaya_mata',
    color: 0xF97316,
    desc: 'Cahaya Berseri-seri (چهاي)',
    pos: { x: 195.0, y: 1.45, z: 202.0 },
    mesh: null, gemMesh: null, ringMesh: null, pointLight: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'mata',
    session: 2,
    name: 'Mata',
    rumi: 'Mata',
    char: '👁️',
    jawi: 'مات',
    letters: ['م', 'ا', 'ت'],
    idiomGroup: 'cahaya_mata',
    color: 0x06B6D4,
    desc: 'Mata Penyeri (مات)',
    pos: { x: 205.0, y: 1.45, z: 202.0 },
    mesh: null, gemMesh: null, ringMesh: null, pointLight: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];

// Combined list for general inventory and HUD display
export const COLLECTIBLES_R2 = [
  ...COLLECTIBLES_R2_SESSION1,
  ...COLLECTIBLES_R2_SESSION2
];

// ==========================================
// 3. COLLECTIBLES ROOM 3 (Arkib Simpulan Bahasa: 4 Idiom Scrolls)
// ==========================================
export const COLLECTIBLES_R3 = [
  {
    id: 'scroll_ulat_buku',
    name: 'Gulungan Ulat Buku',
    label: 'Ulat Buku',
    char: '📜',
    idiom: 'Ulat Buku',
    jawi: 'اولت بوکو',
    desc: 'Orang yang sangat gemar dan rajin membaca buku.',
    color: 0xF59E0B,
    pos: { x: 293.0, y: 1.4, z: 294.5 },
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'scroll_anak_emas',
    name: 'Gulungan Anak Emas',
    label: 'Anak Emas',
    char: '📜',
    idiom: 'Anak Emas',
    jawi: 'انق امس',
    desc: 'Anak yang sangat disayangi dan dimanjakan oleh ibu bapa.',
    color: 0x10B981,
    pos: { x: 307.0, y: 1.4, z: 294.5 },
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'scroll_buah_hati',
    name: 'Gulungan Buah Hati',
    label: 'Buah Hati',
    char: '📜',
    idiom: 'Buah Hati',
    jawi: 'بواه هاتي',
    desc: 'Orang yang amat dikasihi atau kekasih tersayang.',
    color: 0xEC4899,
    pos: { x: 293.0, y: 1.4, z: 303.0 },
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'scroll_cahaya_mata',
    name: 'Gulungan Cahaya Mata',
    label: 'Cahaya Mata',
    char: '📜',
    idiom: 'Cahaya Mata',
    jawi: 'چهاي مات',
    desc: 'Anak kandung yang menjadi penyeri dan harapan keluarga.',
    color: 0x3B82F6,
    pos: { x: 307.0, y: 1.4, z: 303.0 },
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];

// ==========================================
// 4. COLLECTIBLES ROOM 4 (Studio Persembahan Seni Khat: 3 Art Tools)
// ==========================================
export const COLLECTIBLES_R4 = [
  {
    id: 'tool_berus',
    name: 'Berus Khat',
    label: 'Berus Khat',
    char: '🖌️',
    topic: 'Alatan Seni Khat',
    desc: 'Berus buluh kaligrafi bermutu tinggi untuk melukis aksara Jawi yang gemalai.',
    color: 0xD97706,
    pos: { x: 393.5, y: 1.3, z: 395.0 },
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'tool_dakwat',
    name: 'Dakwat Emas',
    label: 'Dakwat Emas',
    char: '✨',
    topic: 'Alatan Seni Khat',
    desc: 'Dakwat pigmen emas berkilau dan warna nila mewah warisan seni khat Melayu.',
    color: 0xF59E0B,
    pos: { x: 406.0, y: 1.3, z: 396.0 },
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  },
  {
    id: 'tool_bingkai',
    name: 'Bingkai Ukir',
    label: 'Bingkai Ukir',
    char: '🖼️',
    topic: 'Alatan Seni Khat',
    desc: 'Bingkai kayu ukir tradisional awan larat untuk mempamerkan seni simpulan bahasa.',
    color: 0x8B5CF6,
    pos: { x: 394.0, y: 1.3, z: 403.5 },
    mesh: null, gemMesh: null, ringMesh: null,
    isPopping: false, popScale: 1.0, collected: false
  }
];
