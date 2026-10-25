// ==========================================
// UI.JS - DOM Manipulations, Audio, Trialogical Modals & PBD Report (Jejak Jawi Bestari)
// ==========================================
import {
  ROOM_CONFIG,
  studentProfile,
  gameScores,
  gameState,
  IDIOM_DATA,
  COLLECTIBLES_R1,
  COLLECTIBLES_R2,
  COLLECTIBLES_R3,
  COLLECTIBLES_R4,
  keys,
  joystickVector
} from './state.js?v=4.4.2';
import { saveArtworkToDB, fetchGalleryArtworks } from './db.js';

let updateEaselCallback = null;
export function registerEaselHandler(fn) {
  updateEaselCallback = fn;
}

// DOM Element References
const locationBadge = document.getElementById('location-badge');
const missionTextEl = document.getElementById('mission-text');
const invTitleTextEl = document.getElementById('inventory-title-text');
const invCountEl = document.getElementById('inventory-count');
const invSlotsContainer = document.getElementById('inventory-slots-container');
const toastEl = document.getElementById('item-toast');
const toastJawiEl = document.getElementById('toast-jawi-char');
const toastMsgEl = document.getElementById('toast-message');
const promptEl = document.getElementById('interact-prompt');
const promptLabelEl = document.getElementById('prompt-label');

let toastTimeout = null;

// Teleport callbacks registered by game.js
let teleportCallbacks = {
  toLobby: null,
  toRoom1: null,
  toRoom2: null,
  toRoom3: null,
  toRoom4: null
};

export function registerTeleportHandlers(handlers) {
  teleportCallbacks = { ...teleportCallbacks, ...handlers };
}

let r2SessionCallback = null;
export function registerR2SessionHandler(fn) {
  r2SessionCallback = fn;
}

// ==========================================
// 1. AUDIO SYNTHESIZER (Web Audio API & Global Audio Unlocker)
// ==========================================
const audioCtx = (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

// Global Audio Unlocker for Mobile & Desktop Safari / Chrome / Firefox
let isAudioUnlocked = false;
export function unlockAudio() {
  if (isAudioUnlocked) return;
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const silent = new SpeechSynthesisUtterance('');
      silent.volume = 0.01;
      silent.rate = 2.0;
      window.speechSynthesis.speak(silent);
    } catch (e) {}
  }
  isAudioUnlocked = true;
}

if (typeof window !== 'undefined') {
  ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { passive: true });
  });
}

export function playTone(freq, type = 'sine', duration = 0.2, delay = 0) {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}

export function playCollectChime() {
  playTone(523.25, 'triangle', 0.15, 0);     // C5
  playTone(659.25, 'triangle', 0.15, 0.08);  // E5
  playTone(783.99, 'triangle', 0.25, 0.16);  // G5
  playTone(1046.5, 'sine', 0.35, 0.24);      // C6
}

export function playJawiCardTone(stepIndex = 1) {
  const baseFreqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25];
  const freq = baseFreqs[(stepIndex - 1) % baseFreqs.length] || 440;
  playTone(freq, 'triangle', 0.22, 0);
  playTone(freq * 1.5, 'sine', 0.32, 0.07);
}

export function playSuccessFanfare() {
  playTone(440.0, 'sine', 0.15, 0);
  playTone(554.37, 'sine', 0.15, 0.12);
  playTone(659.25, 'sine', 0.15, 0.24);
  playTone(880.0, 'triangle', 0.45, 0.36);
  playTone(1108.73, 'triangle', 0.55, 0.48);
}

export function playTeleportSfx() {
  playTone(330, 'sine', 0.12, 0);
  playTone(493.88, 'sine', 0.15, 0.08);
  playTone(659.25, 'triangle', 0.25, 0.16);
}

export function playErrorBuzzer() {
  playTone(260, 'sawtooth', 0.2, 0);
  playTone(220, 'sawtooth', 0.3, 0.15);
}

// ==========================================
// 1.5 BAHASA MELAYU & JAWI VOICEOVER (SpeechSynthesis Engine)
// ==========================================
let isVoiceMuted = false;
let cachedVoices = [];

function loadVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function toggleVoiceover() {
  isVoiceMuted = !isVoiceMuted;
  if (isVoiceMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  const btn = document.getElementById('voice-toggle-btn');
  if (btn) {
    btn.classList.toggle('muted', isVoiceMuted);
    btn.innerHTML = isVoiceMuted ? '🔇 <span id="voice-toggle-label">Suara: Senyap</span>' : '🔊 <span id="voice-toggle-label">Suara: Hidup</span>';
  }
  showItemToast(isVoiceMuted ? '🔇' : '🔊', isVoiceMuted ? 'Suara latar dipadamkan.' : 'Suara latar Bahasa Melayu diaktifkan!');
}

export function speakBM(text) {
  if (isVoiceMuted) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[-•—_]/g, ' ').trim();
    if (!cleanText) return;

    // Small delay ensures Safari/WebKit speech queue registers cleanly after cancel
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.88;
        utterance.pitch = 1.05;

        if (!cachedVoices.length) {
          cachedVoices = window.speechSynthesis.getVoices() || [];
        }

        // Tier 1: Look for Malay voice (ms-MY, ms)
        let selectedVoice = cachedVoices.find(v => v.lang && (v.lang.startsWith('ms') || v.lang === 'ms-MY' || v.lang === 'ms_MY'));

        // Tier 2: Look for Indonesian voice (id-ID, id) - phonetically identical
        if (!selectedVoice) {
          selectedVoice = cachedVoices.find(v => v.lang && (v.lang.startsWith('id') || v.lang === 'id-ID' || v.lang === 'id_ID'));
        }

        // Tier 3: Look for Arabic voice (ar-SA, ar) for authentic pronunciation of classical Jawi letters
        if (!selectedVoice && /alif|ba|ta|tsa|jim|cha|ha|kha|dal|dzal|ra|zai|sin|syin|sod|dhad|tho|dzo|ain|ghain|nga|fa|pa|qaf|kaf|ga|lam|mim|nun|wau|va|hamzah|ya|ye|nya/i.test(cleanText)) {
          selectedVoice = cachedVoices.find(v => v.lang && v.lang.startsWith('ar'));
        }

        // Tier 4: Fallback to system default or first available voice
        if (!selectedVoice) {
          selectedVoice = cachedVoices.find(v => v.default) || cachedVoices[0] || null;
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang || 'ms-MY';
        } else {
          utterance.lang = 'ms-MY';
        }

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          playJawiCardTone(1);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech dispatch error', err);
        playJawiCardTone(1);
      }
    }, 45);
  } catch (e) {
    console.warn('Speech top-level error', e);
  }
}

// ==========================================
// 2. HUD & TOAST NOTIFICATIONS
// ==========================================
export function showItemToast(char, text, duration = 2800) {
  if (!toastEl || !toastJawiEl || !toastMsgEl) return;
  toastJawiEl.textContent = char;
  toastMsgEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, duration);
}

export function updateLocationBadge(text, isSpecial = false) {
  if (!locationBadge) return;
  locationBadge.textContent = text;
  if (isSpecial) {
    locationBadge.classList.add('kitchen');
  } else {
    locationBadge.classList.remove('kitchen');
  }
}

export function updateMissionText(text) {
  if (missionTextEl) {
    missionTextEl.textContent = text;
  }
}

export function updatePrompt(label, isVisible = true) {
  if (!promptEl || !promptLabelEl) return;
  if (isVisible && !gameState.activeModal) {
    promptLabelEl.textContent = label;
    promptEl.style.display = 'flex';
  } else {
    promptEl.style.display = 'none';
  }
}

// ==========================================
// 3. DYNAMIC INVENTORY HUD ACROSS 5 AREAS
// ==========================================
export function updateInventoryHUD() {
  updateMissionChecklist();
  if (!invSlotsContainer) return;
  invSlotsContainer.innerHTML = '';

  const room = gameState.currentRoom;

  // Toggle Home Button visibility: only show when inside Rooms 1-4, hide in lobby
  const homeBtn = document.getElementById('btn-home-lobby');
  if (homeBtn) {
    homeBtn.style.display = (room === 'lobby') ? 'none' : 'inline-flex';
  }

  // Toggle Inventory Card visibility: hide in lobby, show compact chip in rooms
  const invCard = document.querySelector('.inventory-card');
  if (invCard) {
    invCard.style.display = (room === 'lobby') ? 'none' : 'inline-flex';
  }

  if (room === 'lobby') {
    return;
  }

  if (room === 'room1') {
    const collected = COLLECTIBLES_R1.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Pagar Sesat Jawi';
    if (invCountEl) invCountEl.textContent = `${collected} / 10 Pos`;
    return;
  }

  if (room === 'room2') {
    const collected = COLLECTIBLES_R2.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Makmal Kata';
    if (invCountEl) invCountEl.textContent = `${collected} / 8 Jubin`;
    return;
  }

  if (room === 'room3') {
    const collected = COLLECTIBLES_R3.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Arkib Simpulan';
    if (invCountEl) invCountEl.textContent = `${collected} / 4 Gulung`;
    return;
  }

  if (room === 'room4') {
    const collected = COLLECTIBLES_R4.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Studio Seni Khat';
    if (invCountEl) invCountEl.textContent = `${collected} / 3 Alatan`;
    return;
  }
}

// ==========================================
// 4. ITEM COLLECTION ROUTER
// ==========================================
export function collectItem(item, currentRoom) {
  item.collected = true;
  item.isPopping = true;
  playCollectChime();

  if (currentRoom === 'room1') {
    showItemToast(item.char, `Pos ${item.stepIndex} Ditemui: ${item.char} (${item.name})`);
    playJawiCardTone(item.stepIndex);
    speakBM(`Pos ${item.stepIndex}: Huruf ${item.name}. ${item.char}`);
    const count = COLLECTIBLES_R1.filter(c => c.collected).length;
    if (count === 10) {
      gameState.room1Completed = true;
      updateMissionChecklist();
      updateMissionText('Tahniah! Semua 10 kumpulan huruf ditemui. Pergi ke Papan Pintar di hujung pagar sesat!');
    } else {
      updateMissionText(`Misi: Ikuti anak panah ke Pos ${count + 1} (${10 - count} pos lagi).`);
    }
  } else if (currentRoom === 'room2') {
    showItemToast(item.char, `Jubin Bergambar: ${item.name} (${item.jawi})`);
    speakBM(`Jubin bergambar: ${item.name}. Jawi: ${item.jawi}`);
    const count = COLLECTIBLES_R2.filter(c => c.collected).length;
    if (count === 8) {
      updateMissionText('Tahniah! Semua 8 jubin bergambar ditemui. Pergi ke Meja Makmal untuk mengeja perkataan Jawi!');
    } else {
      updateMissionText(`Misi: Cari ${8 - count} lagi jubin bergambar di Makmal Kata.`);
    }
  } else if (currentRoom === 'room3') {
    showItemToast(item.char, `${item.name}: ${item.desc}`, 3800);
    speakBM(`Gulungan simpulan bahasa ditemui: ${item.idiom}. ${item.jawi}`);
    const count = COLLECTIBLES_R3.filter(c => c.collected).length;
    if (count === 4) {
      updateMissionText('Tahniah! Semua 4 gulungan simpulan bahasa ditemui. Pergi ke Meja Bacaan untuk cantuman & maksud!');
    } else {
      updateMissionText(`Misi: Cari ${4 - count} lagi gulungan simpulan bahasa di Arkib.`);
    }
  } else if (currentRoom === 'room4') {
    showItemToast(item.char, `${item.name}: ${item.desc}`, 4000);
    speakBM(`Alatan seni khat ditemui: ${item.name}. ${item.desc}`);
    const count = COLLECTIBLES_R4.filter(c => c.collected).length;
    if (count === 3) {
      updateMissionText('Tahniah! Semua alatan seni khat ditemui. Pergi ke Kanvas Utama untuk menghasilkan karya seni Jawi!');
    } else {
      updateMissionText(`Misi: Cari ${3 - count} lagi alatan seni di studio.`);
    }
  }

  updateInventoryHUD();
}

// ==========================================
// 5. STUDENT PROFILE MODAL
// ==========================================
export function openProfileModal() {
  const nameInput = document.getElementById('input-student-name');
  const classInput = document.getElementById('input-student-class');
  if (nameInput) nameInput.value = studentProfile.name;
  if (classInput) classInput.value = studentProfile.class;
  openModal('profile-modal');
}

export function saveProfile() {
  const nameInput = document.getElementById('input-student-name');
  const classInput = document.getElementById('input-student-class');

  const nameVal = nameInput ? nameInput.value.trim() : '';
  const classVal = classInput ? classInput.value.trim() : '';

  studentProfile.name = nameVal || 'Penjelajah Bestari';
  studentProfile.class = classVal || '4 Inovatif';

  const hudName = document.getElementById('hud-student-name');
  const hudClass = document.getElementById('hud-student-class');
  if (hudName) hudName.textContent = studentProfile.name;
  if (hudClass) hudClass.textContent = studentProfile.class;

  closeModal('profile-modal');
  showItemToast('🎓', `Profil Dikemaskini: ${studentProfile.name} (${studentProfile.class})`);
}

// ==========================================
// 6. MODAL OVERLAY CONTROLS
// ==========================================
export function openModal(modalId) {
  gameState.activeModal = modalId;
  const modalEl = document.getElementById(modalId);
  if (modalEl) modalEl.classList.add('active');
  if (promptEl) promptEl.style.display = 'none';
}

export function closeModal(modalId) {
  const modalEl = document.getElementById(modalId);
  if (modalEl) modalEl.classList.remove('active');
  gameState.activeModal = null;
}

export function openIntroModal() {
  openModal('intro-modal');
  gameState.activeModal = 'intro-modal';
}

// ==========================================
// 6.1 MAIN MENU CONTROLS
// ==========================================
export function startMainGame() {
  unlockAudio();
  playCollectChime();
  const menu = document.getElementById('main-menu');
  if (menu) {
    menu.classList.add('hidden');
    setTimeout(() => {
      menu.style.display = 'none';
    }, 450);
  }
  openIntroModal();
}

// ==========================================
// 6.2 HOME BUTTON & ACTIVE ROOM STATE RESET
// ==========================================
// Room 2 Tab & Tray State Variables (accessible across ui.js)
export let r2ActiveTab = 0;
export let r2TabCompleted = [false, false, false, false];
export let r2Trays = [null, null, null, null];
export let r2UserSlots = [null, null, null, null];
export let r2DragData = null;
export let r2JustDragged = false;

export function resetRoomProgress(roomId) {
  if (roomId === 'room1') {
    gameState.room1Completed = false;
    gameState.currentR1Step = 1;
    COLLECTIBLES_R1.forEach((c, idx) => {
      c.collected = false;
      c.isPopping = false;
      c.popScale = 1.0;
      if (c.mesh) {
        c.mesh.visible = true;
        c.mesh.scale.set(1, 1, 1);
        if (c.pos) c.mesh.position.set(c.pos.x, c.pos.y, c.pos.z);
      }
      if (c.ringMesh && c.ringMesh.material) {
        if (idx === 0) {
          c.ringMesh.material.color.setHex(0xF59E0B);
          c.ringMesh.material.emissive.setHex(0xF59E0B);
          c.ringMesh.material.emissiveIntensity = 1.0;
        } else {
          c.ringMesh.material.color.setHex(0x64748B);
          c.ringMesh.material.emissive.setHex(0x334155);
          c.ringMesh.material.emissiveIntensity = 0.3;
        }
      }
      if (c.pointLight) {
        c.pointLight.intensity = (idx === 0) ? 2.4 : 0.6;
      }
    });
    if (typeof renderJawiChartGrid === 'function') {
      renderJawiChartGrid();
    }
    const feedback = document.getElementById('r1-feedback');
    if (feedback) {
      feedback.className = 'feedback-banner info';
      feedback.style.display = 'none';
      feedback.textContent = '';
    }
  } else if (roomId === 'room2') {
    gameState.room2Completed = false;
    gameState.r2Session = 1;
    gameState.r2Session1Completed = false;
    gameState.puzzleR2Placed = [null, null];
    r2ActiveTab = 0;
    r2TabCompleted = [false, false, false, false];
    r2Trays = [null, null, null, null];
    r2UserSlots = [null, null, null, null];
    COLLECTIBLES_R2.forEach(c => {
      c.collected = false;
      c.isPopping = false;
      c.popScale = 1.0;
      if (c.mesh) {
        // Show Session 1 items; hide Session 2 items until Session 1 completes
        c.mesh.visible = (c.session === 1);
        c.mesh.scale.set(1, 1, 1);
        if (c.pos) c.mesh.position.set(c.pos.x, c.pos.y, c.pos.z);
      }
    });
    const proceedR3Btn = document.getElementById('btn-proceed-r3');
    if (proceedR3Btn) proceedR3Btn.style.display = 'none';
    const r2Feedback = document.getElementById('r2-feedback');
    if (r2Feedback) {
      r2Feedback.style.display = 'none';
      r2Feedback.textContent = '';
    }
  } else if (roomId === 'room3') {
    gameState.room3Completed = false;
    gameState.puzzleR3Pairs = {};
    COLLECTIBLES_R3.forEach(c => {
      c.collected = false;
      c.isPopping = false;
      c.popScale = 1.0;
      if (c.mesh) {
        c.mesh.visible = true;
        c.mesh.scale.set(1, 1, 1);
        if (c.pos) c.mesh.position.set(c.pos.x, c.pos.y, c.pos.z);
      }
    });
    const proceedR4Btn = document.getElementById('btn-proceed-r4');
    if (proceedR4Btn) proceedR4Btn.style.display = 'none';
    const r3Feedback = document.getElementById('r3-feedback');
    if (r3Feedback) {
      r3Feedback.style.display = 'none';
      r3Feedback.textContent = '';
    }
  } else if (roomId === 'room4') {
    gameState.room4Completed = false;
    COLLECTIBLES_R4.forEach(c => {
      c.collected = false;
      c.isPopping = false;
      c.popScale = 1.0;
      if (c.mesh) {
        c.mesh.visible = true;
        c.mesh.scale.set(1, 1, 1);
        if (c.pos) c.mesh.position.set(c.pos.x, c.pos.y, c.pos.z);
      }
    });
  }
}

export function replayRoom1() {
  resetRoomProgress('room1');
  gameScores.attemptsR1 = 0;
  if (typeof renderJawiChartGrid === 'function') {
    renderJawiChartGrid();
  }
  updateInventoryHUD();
  updateMissionChecklist();
  closeModal('room1-modal');
  showItemToast('🔄', 'Labirin Bilik 1 diulang semula! Sila kutip huruf bermula dari Pos 1 (Alif).');
  speakBM('Labirin Bilik satu diulang semula. Sila kutip huruf bermula dari Pos satu.');
}

export function confirmReturnToLobby() {
  if (gameState.currentRoom === 'lobby') {
    showItemToast('🏫', 'Anda sudah berada di Dataran Sekolah (Lobi)!');
    return;
  }

  const ok = window.confirm('Adakah anda pasti mahu kembali ke lobi? Semua progress bilik akan diulang semula dari awal.');
  if (!ok) return;

  // Hide any active room UI / modals
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  gameState.activeModal = null;
  if (typeof closeGallerySidebar === 'function') {
    closeGallerySidebar();
  }

  // Reset ALL room states from scratch
  resetRoomProgress('room1');
  resetRoomProgress('room2');
  resetRoomProgress('room3');
  resetRoomProgress('room4');

  // Reset all scores & attempts
  gameScores.room2 = 30;
  gameScores.room3 = 30;
  gameScores.room4 = 40;
  gameScores.attemptsR1 = 0;
  gameScores.attemptsR2 = 0;
  gameScores.attemptsR3 = 0;
  gameScores.attemptsR4 = 0;

  // Reset player 3D coordinates to Lobby starting position
  if (teleportCallbacks.toLobby) {
    teleportCallbacks.toLobby();
  }

  updateInventoryHUD();
  updateMissionChecklist();
  showItemToast('🏠', 'Kembali ke Dataran Lobi. Semua bilik telah diulang semula.');
}

// ==========================================
// 6.3 DYNAMIC MISSION CHECKLIST
// ==========================================
export function updateMissionChecklist() {
  const missions = [
    { id: 'r1', completed: !!gameState.room1Completed },
    { id: 'r2', completed: !!gameState.room2Completed },
    { id: 'r3', completed: !!gameState.room3Completed },
    { id: 'r4', completed: !!gameState.room4Completed }
  ];

  missions.forEach(m => {
    const itemEl = document.getElementById(`task-${m.id}`);
    const boxEl = document.getElementById(`task-box-${m.id}`);
    if (boxEl) {
      boxEl.textContent = m.completed ? '[✅]' : '[ ]';
    }
    if (itemEl) {
      if (m.completed) {
        itemEl.classList.add('completed');
      } else {
        itemEl.classList.remove('completed');
      }
    }
  });
}

export function toggleMissionChecklist() {
  const bodyEl = document.getElementById('checklist-body');
  const iconEl = document.getElementById('checklist-toggle-icon');
  if (!bodyEl) return;
  bodyEl.classList.toggle('collapsed');
  if (iconEl) {
    iconEl.textContent = bodyEl.classList.contains('collapsed') ? '+' : '−';
  }
}

// ==========================================
// 6.4 KAMUS RUMI KE JAWI (66K TSV DATASET)
// ==========================================

// Global high-speed Map object for instant O(1) translation lookup
if (typeof window !== 'undefined') {
  window.kamusDB = window.kamusDB || new Map();
}

// Core Simpulan Bahasa
export const CORE_SIMPULAN_BAHASA = {
  'ulat buku': 'اولت بوکو',
  'anak emas': 'انق امس',
  'buah hati': 'بواه هاتي',
  'cahaya mata': 'چهاي مات'
};

// Seed core idioms into Map immediately
if (typeof window !== 'undefined' && window.kamusDB) {
  Object.entries(CORE_SIMPULAN_BAHASA).forEach(([k, v]) => window.kamusDB.set(k, v));
}

// Hardcoded essential vocabulary fallback
export const KAMUS_DICTIONARY = {
  ...CORE_SIMPULAN_BAHASA,
  'ulatbuku': 'اولت بوکو',
  'anakemas': 'انق امس',
  'buahhati': 'بواه هاتي',
  'cahayamata': 'چهاي مات',
  'ulat': 'اولت',
  'buku': 'بوکو',
  'anak': 'انق',
  'emas': 'امس',
  'buah': 'بواه',
  'hati': 'هاتي',
  'cahaya': 'چهاي',
  'mata': 'مات',
  'jawi': 'جاوي',
  'bahasa': 'بهاس',
  'melayu': 'ملايو',
  'sekolah': 'سکوله',
  'bestari': 'بستاري',
  'cikgu': 'چيقݢو',
  'guru': 'ݢورو',
  'murid': 'موريد',
  'khat': 'خط',
  'seni': 'سني',
  'karya': 'کريا',
  'arkib': 'ارکيب',
  'makmal': 'معمل',
  'pagar': 'ڤاݢر',
  'sesat': 'سست',
  'taman': 'تامن'
};

const JAWI_DIGRAPHS = {
  'ng': 'ڠ',
  'ny': 'ڽ',
  'sy': 'ش',
  'kh': 'خ',
  'gh': 'غ',
  'ch': 'چ'
};

const JAWI_CHAR_MAP = {
  'a': 'ا',
  'b': 'ب',
  'c': 'چ',
  'd': 'د',
  'e': 'ي',
  'f': 'ف',
  'g': 'ݢ',
  'h': 'ه',
  'i': 'ي',
  'j': 'ج',
  'k': 'ک',
  'l': 'ل',
  'm': 'م',
  'n': 'ن',
  'o': 'و',
  'p': 'ڤ',
  'q': 'ق',
  'r': 'ر',
  's': 'س',
  't': 'ت',
  'u': 'و',
  'v': 'ۏ',
  'w': 'و',
  'x': 'ک س',
  'y': 'ي',
  'z': 'ز'
};

let isKamusLoading = false;
let isKamusReady = false;

/**
 * 1. Data Fetching & Parsing:
 * Loads the 66,000 Rumi-to-Jawi dataset from rumi-jawi.tsv and parses into window.kamusDB Map.
 */
export async function loadKamusData() {
  if (isKamusReady || isKamusLoading) return;
  isKamusLoading = true;

  const statusEl = document.getElementById('kamus-status-indicator');
  if (statusEl) {
    statusEl.textContent = 'Status Kamus: Memuatkan pangkalan data...';
    statusEl.classList.remove('ready');
  }

  try {
    const response = await fetch('rumi-jawi.tsv');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    const lines = text.split(/\r?\n/);
    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Ignore TSV header line
      if (i === 0 && line.toLowerCase().startsWith('rumi')) {
        continue;
      }

      const tabIndex = line.indexOf('\t');
      if (tabIndex === -1) continue;

      const rumi = line.slice(0, tabIndex).trim().toLowerCase();
      const jawi = line.slice(tabIndex + 1).trim();

      if (rumi && jawi) {
        if (!window.kamusDB.has(rumi)) {
          window.kamusDB.set(rumi, jawi);
        }
        count++;
      }
    }

    // Ensure core Simpulan Bahasa remain 100% accurate
    Object.entries(CORE_SIMPULAN_BAHASA).forEach(([k, v]) => window.kamusDB.set(k, v));

    isKamusReady = true;
    isKamusLoading = false;

    if (statusEl) {
      statusEl.textContent = 'Status Kamus: Sedia (66k Perkataan)';
      statusEl.classList.add('ready');
    }

    console.log(`[Kamus] Pangkalan data Rumi-Jawi berjaya dimuat (${count} pasangan perkataan).`);

    // If there is an active input in Kamus modal, refresh translation immediately
    const inputEl = document.getElementById('kamus-rumi-input');
    if (inputEl && inputEl.value) {
      transliterateRumiToJawi(inputEl.value);
    }
  } catch (err) {
    console.warn('[Kamus] Ralat memuatkan rumi-jawi.tsv, menggunakan enjin sandaran:', err);
    isKamusLoading = false;
    if (statusEl) {
      statusEl.textContent = 'Status Kamus: Sedia (Enjin Sandaran)';
      statusEl.classList.add('ready');
    }
  }
}

/**
 * Fallback character & digraph transliteration for words not in the 66k dataset
 */
export function fallbackTransliterate(word) {
  const w = word.toLowerCase();
  let result = '';
  let i = 0;
  const len = w.length;

  while (i < len) {
    // Check 2-letter digraphs first
    if (i + 1 < len) {
      const two = w.slice(i, i + 2);
      if (JAWI_DIGRAPHS[two]) {
        result += JAWI_DIGRAPHS[two];
        i += 2;
        continue;
      }
    }

    const ch = w[i];
    // Special initial vowel handling for clean Malay Jawi
    if (i === 0) {
      if (ch === 'a') {
        result += 'ا';
        i++;
        continue;
      } else if (ch === 'i' || ch === 'e') {
        result += 'اي';
        i++;
        continue;
      } else if (ch === 'u' || ch === 'o') {
        result += 'او';
        i++;
        continue;
      }
    }

    // Special ending 'k' in Malay is often 'ق' (Qaf)
    if (ch === 'k' && i === len - 1 && len > 2) {
      result += 'ق';
      i++;
      continue;
    }

    if (JAWI_CHAR_MAP[ch]) {
      result += JAWI_CHAR_MAP[ch];
    } else {
      result += ch;
    }
    i++;
  }

  return result;
}

/**
 * Translates a single word using Map -> Dictionary -> Fallback
 */
export function transliterateWord(rawWord) {
  const w = rawWord.toLowerCase();

  // 1. Search 66,000 dataset in Map
  if (window.kamusDB && window.kamusDB.has(w)) {
    return window.kamusDB.get(w);
  }

  // 2. Check hardcoded dictionary
  if (KAMUS_DICTIONARY[w]) {
    return KAMUS_DICTIONARY[w];
  }

  // 3. Fallback character/digraph algorithm for typos or names
  return fallbackTransliterate(w);
}

/**
 * 2. Smart Lookup Logic:
 * Converts input to lowercase, searches Map, handles multi-word phrases, with fallback safety net.
 */
export function transliterateRumiToJawi(rawInput) {
  const outputEl = document.getElementById('kamus-jawi-output');
  const badgeEl = document.getElementById('kamus-exact-badge');
  if (!outputEl) return '';

  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    outputEl.textContent = '...';
    if (badgeEl) badgeEl.style.display = 'none';
    return '';
  }

  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');

  // 1. Direct exact match in window.kamusDB (Full input string, e.g. 'ulat buku' or 'makan')
  if (window.kamusDB && window.kamusDB.has(normalized)) {
    const jawiText = window.kamusDB.get(normalized);
    outputEl.textContent = jawiText;
    const isCoreIdiom = !!CORE_SIMPULAN_BAHASA[normalized];
    if (badgeEl) badgeEl.style.display = isCoreIdiom ? 'inline-block' : 'none';
    return jawiText;
  }

  // Check hardcoded dictionary for exact phrase
  if (KAMUS_DICTIONARY[normalized]) {
    const jawiText = KAMUS_DICTIONARY[normalized];
    outputEl.textContent = jawiText;
    const isCoreIdiom = !!CORE_SIMPULAN_BAHASA[normalized];
    if (badgeEl) badgeEl.style.display = isCoreIdiom ? 'inline-block' : 'none';
    return jawiText;
  }

  // 2. Multi-word phrase: split by spaces, translate each word individually, join back together
  const words = normalized.split(' ');
  const transliteratedWords = words.map(w => transliterateWord(w));
  const finalJawi = transliteratedWords.join(' ');

  outputEl.textContent = finalJawi;

  const containsCoreIdiom = Object.keys(CORE_SIMPULAN_BAHASA).some(ci => normalized.includes(ci));
  if (badgeEl) badgeEl.style.display = containsCoreIdiom ? 'inline-block' : 'none';

  return finalJawi;
}

export function openKamusModal() {
  openModal('kamus-modal');
  if (!isKamusReady && !isKamusLoading) {
    loadKamusData();
  }
  const inputEl = document.getElementById('kamus-rumi-input');
  if (inputEl) {
    setTimeout(() => {
      inputEl.focus();
    }, 150);
    if (inputEl.value) {
      transliterateRumiToJawi(inputEl.value);
    }
  }
}

export function insertKamusPrompt(phrase) {
  const inputEl = document.getElementById('kamus-rumi-input');
  if (inputEl) {
    inputEl.value = phrase;
    transliterateRumiToJawi(phrase);
    inputEl.focus();
  }
}

export function clearKamusInput() {
  const inputEl = document.getElementById('kamus-rumi-input');
  const outputEl = document.getElementById('kamus-jawi-output');
  const badgeEl = document.getElementById('kamus-exact-badge');
  if (inputEl) {
    inputEl.value = '';
    inputEl.focus();
  }
  if (outputEl) outputEl.textContent = '...';
  if (badgeEl) badgeEl.style.display = 'none';
}

export function copyKamusJawi() {
  const outputEl = document.getElementById('kamus-jawi-output');
  const text = outputEl ? outputEl.textContent.trim() : '';
  if (!text || text === '...') {
    showItemToast('⚠️', 'Sila tulis perkataan Rumi terlebih dahulu!');
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showItemToast('📋', `Teks Jawi berjaya disalin: ${text}`);
      playTone(880, 'sine', 0.15);
    }).catch(() => {
      showItemToast('📋', text);
    });
  } else {
    showItemToast('📋', text);
  }
}

export function speakKamusJawi() {
  const inputEl = document.getElementById('kamus-rumi-input');
  const outputEl = document.getElementById('kamus-jawi-output');
  const rumi = inputEl ? inputEl.value.trim() : '';
  const jawi = outputEl ? outputEl.textContent.trim() : '';
  if (!rumi || jawi === '...') {
    showItemToast('⚠️', 'Sila masukkan perkataan untuk didengari.');
    return;
  }
  speakBM(`${rumi}. Ejaan Jawi: ${jawi}`, 0.9);
}

export function initKamus() {
  const inputEl = document.getElementById('kamus-rumi-input');
  if (inputEl) {
    inputEl.addEventListener('input', (e) => {
      transliterateRumiToJawi(e.target.value);
    });
  }
  loadKamusData();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initKamus();
      updateMissionChecklist();
      updateInventoryHUD();
    });
  } else {
    setTimeout(() => {
      initKamus();
      updateMissionChecklist();
      updateInventoryHUD();
    }, 50);
  }
}

export function handleOverlayClick(event, modalId) {
  if (event.target && event.target.id === modalId) {
    closeModal(modalId);
  }
}

// ==========================================
// 7. INTERACTION DISPATCHER (PRESS 'E')
// ==========================================
export function handleCurrentInteraction() {
  const target = gameState.nearbyTarget;

  if (target === 'npcTeacher') {
    showItemToast('👩‍🏫', `Cikgu Asyikin: "Selamat datang, ${studentProfile.name}! Sedia meneroka keindahan seni Jawi di Sekolah Bestari?"`);
    openProfileModal();
    return;
  }

  if (target === 'noticeboard') {
    openModal('noticeboard-modal');
    return;
  }

  if (target === 'portalR1') {
    if (teleportCallbacks.toRoom1) {
      teleportCallbacks.toRoom1();
      updateInventoryHUD();
    }
    return;
  }

  if (target === 'portalR2') {
    if (!gameState.room1Completed) {
      playErrorBuzzer();
      showItemToast('⚠️', 'Sila selesaikan penerokaan Pagar Sesat Jawi di Papan Pintar terlebih dahulu!');
      return;
    }
    if (teleportCallbacks.toRoom2) {
      teleportCallbacks.toRoom2();
      updateInventoryHUD();
    }
    return;
  }

  if (target === 'portalR3') {
    if (!gameState.room2Completed) {
      playErrorBuzzer();
      showItemToast('⚠️', 'Sila selesaikan ejaan 4 pasangan kata di Meja Makmal terlebih dahulu!');
      return;
    }
    if (teleportCallbacks.toRoom3) {
      teleportCallbacks.toRoom3();
      updateInventoryHUD();
    }
    return;
  }

  if (target === 'portalR4') {
    if (!gameState.room3Completed) {
      playErrorBuzzer();
      showItemToast('⚠️', 'Sila selesaikan cantuman & padanan maksud di Meja Bacaan terlebih dahulu!');
      return;
    }
    if (teleportCallbacks.toRoom4) {
      teleportCallbacks.toRoom4();
      updateInventoryHUD();
    }
    return;
  }

  if (target === 'returnLobby') {
    showFinalPBDReport();
    return;
  }

  if (target === 'tableR1') {
    openRoom1Modal();
    return;
  }

  if (target === 'tableR2') {
    openRoom2Modal();
    return;
  }

  if (target === 'tableR3') {
    openRoom3Modal();
    return;
  }

  if (target === 'tableR4') {
    openRoom4Modal();
    return;
  }
}

// ==========================================
// 8. ROOM 1 MODAL: CARTA INTERAKTIF HURUF JAWI (ALIF - NYA)
// ==========================================
const ALL_JAWI_LETTERS = [
  { char: 'ا', name: 'Alif', rumi: 'A', step: 1 },
  { char: 'ب', name: 'Ba', rumi: 'B', step: 1 },
  { char: 'ت', name: 'Ta', rumi: 'T', step: 1 },
  { char: 'ث', name: 'Tsa', rumi: 'Ts', step: 1 },
  { char: 'ج', name: 'Jim', rumi: 'J', step: 2 },
  { char: 'چ', name: 'Cha', rumi: 'C', step: 2 },
  { char: 'ح', name: 'Ha', rumi: 'H', step: 2 },
  { char: 'خ', name: 'Kha', rumi: 'Kh', step: 2 },
  { char: 'د', name: 'Dal', rumi: 'D', step: 3 },
  { char: 'ذ', name: 'Dzal', rumi: 'Dz', step: 3 },
  { char: 'ر', name: 'Ra', rumi: 'R', step: 3 },
  { char: 'ز', name: 'Zai', rumi: 'Z', step: 3 },
  { char: 'س', name: 'Sin', rumi: 'S', step: 4 },
  { char: 'ش', name: 'Syin', rumi: 'Sy', step: 4 },
  { char: 'ص', name: 'Sod', rumi: 'S', step: 4 },
  { char: 'ض', name: 'Dhad', rumi: 'Dh', step: 4 },
  { char: 'ط', name: 'Tho', rumi: 'Th', step: 5 },
  { char: 'ظ', name: 'Dzo', rumi: 'Dz', step: 5 },
  { char: 'ع', name: 'Ain', rumi: 'A', step: 5 },
  { char: 'غ', name: 'Ghain', rumi: 'Gh', step: 5 },
  { char: 'ڠ', name: 'Nga', rumi: 'Ng', step: 6 },
  { char: 'ف', name: 'Fa', rumi: 'F', step: 6 },
  { char: 'ڤ', name: 'Pa', rumi: 'P', step: 6 },
  { char: 'ق', name: 'Qaf', rumi: 'Q', step: 6 },
  { char: 'ک', name: 'Kaf', rumi: 'K', step: 7 },
  { char: 'ݢ', name: 'Ga', rumi: 'G', step: 7 },
  { char: 'ل', name: 'Lam', rumi: 'L', step: 7 },
  { char: 'م', name: 'Mim', rumi: 'M', step: 7 },
  { char: 'ن', name: 'Nun', rumi: 'N', step: 8 },
  { char: 'و', name: 'Wau', rumi: 'W / U', step: 8 },
  { char: 'ۏ', name: 'Va', rumi: 'V', step: 8 },
  { char: 'ه', name: 'Ha', rumi: 'H', step: 9 },
  { char: 'ء', name: 'Hamzah', rumi: 'Hamzah', step: 9 },
  { char: 'ي', name: 'Ya', rumi: 'Y / I', step: 9 },
  { char: 'ة', name: 'Ta Marbutah', rumi: 'T', step: 9 },
  { char: 'ى', name: 'Ye', rumi: 'E', step: 10 },
  { char: 'ڽ', name: 'Nya', rumi: 'Ny', step: 10 }
];

export function openRoom1Modal() {
  renderJawiChartGrid();
  openModal('room1-modal');
}

export function renderJawiChartGrid() {
  const gridEl = document.getElementById('jawi-chart-grid');
  const countEl = document.getElementById('r1-unlocked-count');
  if (!gridEl) return;

  gridEl.innerHTML = '';
  const collectedSteps = COLLECTIBLES_R1.filter(c => c.collected).length;
  if (countEl) countEl.textContent = collectedSteps;

  ALL_JAWI_LETTERS.forEach(item => {
    const isStepCollected = COLLECTIBLES_R1[item.step - 1] && COLLECTIBLES_R1[item.step - 1].collected;
    const card = document.createElement('div');
    card.className = `jawi-letter-card ${isStepCollected ? 'unlocked' : 'locked'}`;
    card.title = isStepCollected ? `Huruf ${item.name} (${item.char}) - Klik untuk dengar suara` : `Terkunci (Ditemui di Pos ${item.step})`;

    card.innerHTML = `
      <span class="jawi-letter-char">${item.char}</span>
      <span class="jawi-letter-name">${isStepCollected ? item.name : 'Pos ' + item.step}</span>
    `;

    card.onclick = () => {
      unlockAudio();
      card.classList.add('speaking');
      playJawiCardTone(item.step);
      speakBM(`Huruf ${item.name}. ${item.char}`);
      setTimeout(() => card.classList.remove('speaking'), 900);

      if (!isStepCollected) {
        showItemToast(item.char, `Huruf ${item.name} (${item.char}) • Pos ${item.step} dalam maze.`);
      }
    };

    gridEl.appendChild(card);
  });
}

export function quickCollectR1() {
  COLLECTIBLES_R1.forEach(c => {
    c.collected = true;
    if (c.mesh) c.mesh.visible = true;
  });
  gameState.room1Completed = true;
  updateMissionChecklist();
  playSuccessFanfare();
  renderJawiChartGrid();
  updateInventoryHUD();
  const feedback = document.getElementById('r1-feedback');
  if (feedback) {
    feedback.className = 'feedback-banner success';
    feedback.textContent = '🎉 Hebat! Mod Pantas diaktifkan: Kesemua 37 huruf Jawi telah berjaya dibuka.';
    feedback.style.display = 'block';
  }
  showItemToast('🌟', 'Semua 37 Huruf Jawi Berjaya Dibuka!');
  speakBM('Tahniah! Mod pantas diaktifkan. Semua 37 huruf Jawi telah berjaya dibuka.');
}

export function proceedToRoom2() {
  closeModal('room1-modal');
  if (teleportCallbacks.toRoom2) {
    teleportCallbacks.toRoom2();
  }
}

// ==========================================
// 9. ROOM 2 MODAL: MAKMAL EJAAN 4 PASANGAN KATA (30 Marks)
// ==========================================
const R2_PAIRS = [
  {
    tabIdx: 0,
    title: 'Ulat & Buku (Ulat Buku)',
    w1: { id: 'ulat', name: 'Ulat Bulu', rumi: 'ULAT', char: '🐛', jawi: 'اولت', letters: ['ا', 'و', 'ل', 'ت'] },
    w2: { id: 'buku', name: 'Buku', rumi: 'BUKU', char: '📖', jawi: 'بوکو', letters: ['ب', 'و', 'ک', 'و'] }
  },
  {
    tabIdx: 1,
    title: 'Anak & Emas (Anak Emas)',
    w1: { id: 'anak', name: 'Anak / Bayi', rumi: 'ANAK', char: '👶', jawi: 'انق', letters: ['ا', 'ن', 'ق'] },
    w2: { id: 'emas', name: 'Jongkong Emas', rumi: 'EMAS', char: '🪙', jawi: 'امس', letters: ['ا', 'م', 'س'] }
  },
  {
    tabIdx: 2,
    title: 'Buah & Hati (Buah Hati)',
    w1: { id: 'buah', name: 'Buah Epal', rumi: 'BUAH', char: '🍎', jawi: 'بواه', letters: ['ب', 'و', 'ا', 'ه'] },
    w2: { id: 'hati', name: 'Hati / Kasih', rumi: 'HATI', char: '💖', jawi: 'هاتي', letters: ['ه', 'ا', 'ت', 'ي'] }
  },
  {
    tabIdx: 3,
    title: 'Cahaya & Mata (Cahaya Mata)',
    w1: { id: 'cahaya', name: 'Cahaya Suria', rumi: 'CAHAYA', char: '☀️', jawi: 'چهاي', letters: ['چ', 'ه', 'ا', 'ي'] },
    w2: { id: 'mata', name: 'Mata', rumi: 'MATA', char: '👁️', jawi: 'مات', letters: ['م', 'ا', 'ت'] }
  }
];

// True Fisher-Yates shuffle that is NEVER pre-sorted
function fisherYatesShuffle(arr) {
  if (!arr || arr.length <= 1) return [...(arr || [])];
  let shuffled;
  let attempts = 0;
  do {
    shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (attempts < 30 && shuffled.every((v, i) => v === arr[i]));
  return shuffled;
}

// Note: r2ActiveTab, r2TabCompleted, r2Trays, r2UserSlots, r2DragData, r2JustDragged are declared above for room reset access

// Initialize tray with scrambled letters and empty slots
function initR2TabTray(tabIdx) {
  const pair = R2_PAIRS[tabIdx];
  const w1Shuffled = fisherYatesShuffle(pair.w1.letters);
  const w2Shuffled = fisherYatesShuffle(pair.w2.letters);

  r2Trays[tabIdx] = {
    w1: w1Shuffled.map((letter, idx) => ({ id: `w1_${tabIdx}_${idx}_${Math.random().toString(36).substr(2, 4)}`, letter, wordKey: 'w1' })),
    w2: w2Shuffled.map((letter, idx) => ({ id: `w2_${tabIdx}_${idx}_${Math.random().toString(36).substr(2, 4)}`, letter, wordKey: 'w2' }))
  };

  r2UserSlots[tabIdx] = {
    w1: pair.w1.letters.map(() => null),
    w2: pair.w2.letters.map(() => null)
  };
}

// Pre-initialize trays for all 4 tabs
R2_PAIRS.forEach((_, idx) => initR2TabTray(idx));

// Update Tab buttons based on current active session and completion
export function updateR2TabsBar() {
  const isSesi2 = (gameState.r2Session >= 2);
  const btn0 = document.getElementById('r2-tab-0');
  const btn1 = document.getElementById('r2-tab-1');
  const btn2 = document.getElementById('r2-tab-2');
  const btn3 = document.getElementById('r2-tab-3');

  if (btn0) {
    btn0.style.display = 'flex';
    btn0.classList.toggle('active', r2ActiveTab === 0);
    btn0.innerHTML = `<span>🐛 📖</span> ${r2TabCompleted[0] ? '✅ ' : ''}Ulat Buku`;
  }
  if (btn1) {
    btn1.style.display = 'flex';
    btn1.classList.toggle('active', r2ActiveTab === 1);
    btn1.innerHTML = `<span>👶 🪙</span> ${r2TabCompleted[1] ? '✅ ' : ''}Anak Emas`;
  }
  if (btn2) {
    btn2.style.display = isSesi2 ? 'flex' : 'none';
    btn2.classList.toggle('active', r2ActiveTab === 2);
    btn2.innerHTML = `<span>🍎 💖</span> ${r2TabCompleted[2] ? '✅ ' : ''}Buah Hati`;
  }
  if (btn3) {
    btn3.style.display = isSesi2 ? 'flex' : 'none';
    btn3.classList.toggle('active', r2ActiveTab === 3);
    btn3.innerHTML = `<span>☀️ 👁️</span> ${r2TabCompleted[3] ? '✅ ' : ''}Cahaya Mata`;
  }
}

export function openRoom2Modal() {
  updateR2ScoreDisplay();
  if (gameState.r2Session >= 2) {
    // Sesi 2: start at Tab 2 (Buah Hati) or Tab 3 (Cahaya Mata)
    if (!r2TabCompleted[2]) r2ActiveTab = 2;
    else if (!r2TabCompleted[3]) r2ActiveTab = 3;
    else r2ActiveTab = 2;
  } else {
    // Sesi 1: start at Tab 0 (Ulat Buku) or Tab 1 (Anak Emas)
    if (!r2TabCompleted[0]) r2ActiveTab = 0;
    else if (!r2TabCompleted[1]) r2ActiveTab = 1;
    else r2ActiveTab = 0;
  }
  updateR2TabsBar();
  renderR2Tab(r2ActiveTab);
  openModal('room2-modal');
}

export function updateR2ScoreDisplay() {
  const scoreEl = document.getElementById('r2-live-score');
  const attemptsEl = document.getElementById('r2-attempts');
  if (scoreEl) scoreEl.textContent = `${gameScores.room2} / 30`;
  if (attemptsEl) attemptsEl.textContent = gameScores.attemptsR2;
}

export function switchR2Tab(tabIdx) {
  if (tabIdx >= 2 && gameState.r2Session === 1) {
    const feedback = document.getElementById('r2-feedback');
    if (feedback) {
      feedback.className = 'feedback-banner error';
      feedback.textContent = '🔒 Sesi 2 belum dibuka. Sila lengkapkan ejaan Sesi 1 (Tab 1: Ulat Buku & Tab 2: Anak Emas) terlebih dahulu!';
      feedback.style.display = 'block';
    }
    speakBM('Sesi dua belum dibuka. Sila lengkapkan ejaan sesi satu terlebih dahulu.');
    return;
  }
  r2ActiveTab = tabIdx;
  updateR2TabsBar();
  renderR2Tab(tabIdx);
}

export function renderR2Tab(tabIdx) {
  const contentEl = document.getElementById('r2-tab-content');
  const feedback = document.getElementById('r2-feedback');
  if (!contentEl) return;
  if (feedback) feedback.style.display = 'none';

  if (!r2Trays[tabIdx]) {
    initR2TabTray(tabIdx);
  }

  const pair = R2_PAIRS[tabIdx];
  const tray = r2Trays[tabIdx];
  const slots = r2UserSlots[tabIdx];

  // Helper to get available (unplaced) tiles in tray for wordKey
  const getAvailableTiles = (wordKey) => {
    const placedIds = new Set(slots[wordKey].filter(Boolean).map(t => t.id));
    return tray[wordKey].filter(t => !placedIds.has(t.id));
  };

  const availW1 = getAvailableTiles('w1');
  const availW2 = getAvailableTiles('w2');

  contentEl.innerHTML = `
    <div class="r2-words-layout">
      <!-- Word 1 Card -->
      <div class="r2-word-card">
        <div class="r2-word-illus">${pair.w1.char}</div>
        <div class="r2-word-title">${pair.w1.rumi} (${pair.w1.name})</div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">Ejaan Jawi (Kanan ke Kiri &larr;):</div>
        
        <!-- RTL Slots: Word 1 -->
        <div class="rtl-letter-slots">
          ${pair.w1.letters.map((_, sIdx) => {
            const tile = slots.w1[sIdx];
            return `
              <div class="rtl-letter-slot drop-zone ${tile ? 'filled' : ''}"
                   data-word="w1"
                   data-slot="${sIdx}"
                   ondragover="handleR2DragOver(event)"
                   ondragleave="handleR2DragLeave(event)"
                   ondrop="handleR2Drop(event, 'w1', ${sIdx})"
                   onclick="handleR2SlotClick('w1', ${sIdx})">
                ${tile ? `
                  <div class="letter-tile"
                       draggable="true"
                       ondragstart="handleR2DragStart(event, 'slot', 'w1', ${sIdx}, '${tile.letter}', '${tile.id}')"
                       ondragend="handleR2DragEnd(event)">
                    ${tile.letter}
                  </div>
                ` : `<span class="slot-placeholder">${sIdx + 1}</span>`}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Word 1 Shuffled Tray -->
        <div style="font-size: 11px; font-weight: 700; color: #475569; margin: 10px 0 4px; text-align: center;">
          Dulang Huruf (Klik/Tarik ke petak):
        </div>
        <div class="letters-pool"
             ondragover="handleR2DragOver(event)"
             ondragleave="handleR2DragLeave(event)"
             ondrop="handleR2DropToTray(event, 'w1')">
          ${availW1.length === 0 ? '<span style="font-size: 11px; color: #94A3B8;">Semua huruf telah diletakkan.</span>' : ''}
          ${availW1.map((tile) => `
            <div class="pool-letter-tile"
                 draggable="true"
                 data-id="${tile.id}"
                 ondragstart="handleR2DragStart(event, 'tray', 'w1', -1, '${tile.letter}', '${tile.id}')"
                 ondragend="handleR2DragEnd(event)"
                 onclick="handleR2TrayClick('w1', '${tile.id}')">
              ${tile.letter}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Word 2 Card -->
      <div class="r2-word-card">
        <div class="r2-word-illus">${pair.w2.char}</div>
        <div class="r2-word-title">${pair.w2.rumi} (${pair.w2.name})</div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">Ejaan Jawi (Kanan ke Kiri &larr;):</div>
        
        <!-- RTL Slots: Word 2 -->
        <div class="rtl-letter-slots">
          ${pair.w2.letters.map((_, sIdx) => {
            const tile = slots.w2[sIdx];
            return `
              <div class="rtl-letter-slot drop-zone ${tile ? 'filled' : ''}"
                   data-word="w2"
                   data-slot="${sIdx}"
                   ondragover="handleR2DragOver(event)"
                   ondragleave="handleR2DragLeave(event)"
                   ondrop="handleR2Drop(event, 'w2', ${sIdx})"
                   onclick="handleR2SlotClick('w2', ${sIdx})">
                ${tile ? `
                  <div class="letter-tile"
                       draggable="true"
                       ondragstart="handleR2DragStart(event, 'slot', 'w2', ${sIdx}, '${tile.letter}', '${tile.id}')"
                       ondragend="handleR2DragEnd(event)">
                    ${tile.letter}
                  </div>
                ` : `<span class="slot-placeholder">${sIdx + 1}</span>`}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Word 2 Shuffled Tray -->
        <div style="font-size: 11px; font-weight: 700; color: #475569; margin: 10px 0 4px; text-align: center;">
          Dulang Huruf (Klik/Tarik ke petak):
        </div>
        <div class="letters-pool"
             ondragover="handleR2DragOver(event)"
             ondragleave="handleR2DragLeave(event)"
             ondrop="handleR2DropToTray(event, 'w2')">
          ${availW2.length === 0 ? '<span style="font-size: 11px; color: #94A3B8;">Semua huruf telah diletakkan.</span>' : ''}
          ${availW2.map((tile) => `
            <div class="pool-letter-tile"
                 draggable="true"
                 data-id="${tile.id}"
                 ondragstart="handleR2DragStart(event, 'tray', 'w2', -1, '${tile.letter}', '${tile.id}')"
                 ondragend="handleR2DragEnd(event)"
                 onclick="handleR2TrayClick('w2', '${tile.id}')">
              ${tile.letter}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

export function handleR2DragStart(event, sourceType, wordKey, slotIdx, letter, tileId) {
  r2JustDragged = true;
  r2DragData = { sourceType, wordKey, slotIdx, letter, tileId };
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify(r2DragData));
    event.dataTransfer.effectAllowed = 'move';
  }
}

export function handleR2DragEnd(event) {
  r2DragData = null;
  setTimeout(() => {
    r2JustDragged = false;
  }, 100);
}

export function handleR2DragOver(event) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  const el = event.currentTarget;
  if (el && el.classList.contains('drop-zone')) {
    el.classList.add('drag-over');
  }
}

export function handleR2DragLeave(event) {
  const el = event.currentTarget;
  if (el) el.classList.remove('drag-over');
}

export function handleR2Drop(event, targetWordKey, targetSlotIdx) {
  event.preventDefault();
  const el = event.currentTarget;
  if (el) el.classList.remove('drag-over');

  if (!r2DragData && event.dataTransfer) {
    try {
      const raw = event.dataTransfer.getData('text/plain');
      if (raw) r2DragData = JSON.parse(raw);
    } catch (e) {}
  }
  if (!r2DragData) return;

  const { sourceType, wordKey: srcWordKey, slotIdx: srcSlotIdx, tileId } = r2DragData;
  const slots = r2UserSlots[r2ActiveTab];
  const tray = r2Trays[r2ActiveTab];

  // Keep letters within their respective word card
  if (srcWordKey !== targetWordKey) {
    r2DragData = null;
    setTimeout(() => { r2JustDragged = false; }, 100);
    return;
  }

  if (sourceType === 'tray') {
    // Letter dragged from tray into slot [targetWordKey, targetSlotIdx]
    const tile = tray[srcWordKey].find(t => t.id === tileId);
    if (!tile) return;

    // Remove if tile is already in another slot of this word
    slots[targetWordKey].forEach((s, idx) => {
      if (s && s.id === tileId) slots[targetWordKey][idx] = null;
    });

    // Place new tile in target slot
    slots[targetWordKey][targetSlotIdx] = tile;
    playTone(440, 'sine', 0.1);
  } else if (sourceType === 'slot') {
    // Swapping or moving between slots within the word
    const movingTile = slots[srcWordKey][srcSlotIdx];
    const targetTile = slots[targetWordKey][targetSlotIdx];

    slots[targetWordKey][targetSlotIdx] = movingTile;
    slots[srcWordKey][srcSlotIdx] = targetTile;
    playTone(493.88, 'sine', 0.1);
  }

  r2DragData = null;
  setTimeout(() => { r2JustDragged = false; }, 100);
  renderR2Tab(r2ActiveTab);
}

export function handleR2DropToTray(event, targetWordKey) {
  event.preventDefault();
  const el = event.currentTarget;
  if (el) el.classList.remove('drag-over');

  if (!r2DragData && event.dataTransfer) {
    try {
      const raw = event.dataTransfer.getData('text/plain');
      if (raw) r2DragData = JSON.parse(raw);
    } catch (e) {}
  }
  if (!r2DragData) return;

  if (r2DragData.sourceType === 'slot') {
    // Remove from slot back to tray
    const slots = r2UserSlots[r2ActiveTab];
    slots[r2DragData.wordKey][r2DragData.slotIdx] = null;
    playTone(330, 'triangle', 0.08);
  }

  r2DragData = null;
  setTimeout(() => { r2JustDragged = false; }, 100);
  renderR2Tab(r2ActiveTab);
}

// Click tray tile to place into first empty slot
export function handleR2TrayClick(wordKey, tileId) {
  const slots = r2UserSlots[r2ActiveTab];
  const tray = r2Trays[r2ActiveTab];
  const tile = tray[wordKey].find(t => t.id === tileId);
  if (!tile) return;

  // Find first empty slot in that word
  const emptyIdx = slots[wordKey].findIndex(s => s === null);
  if (emptyIdx !== -1) {
    slots[wordKey][emptyIdx] = tile;
    playTone(440, 'sine', 0.1);
    renderR2Tab(r2ActiveTab);
  }
}

// Click filled slot to remove tile back to tray
export function handleR2SlotClick(wordKey, slotIdx) {
  if (r2JustDragged) {
    r2JustDragged = false;
    return;
  }
  const slots = r2UserSlots[r2ActiveTab];
  if (slots[wordKey][slotIdx]) {
    slots[wordKey][slotIdx] = null;
    playTone(330, 'triangle', 0.08);
    renderR2Tab(r2ActiveTab);
  }
}

// Backwards-compatible aliases
export function addR2Letter(letter) {
  const tray = r2Trays[r2ActiveTab];
  if (!tray) return;
  const t1 = tray.w1.find(t => t.letter === letter && !r2UserSlots[r2ActiveTab].w1.some(s => s && s.id === t.id));
  if (t1) {
    handleR2TrayClick('w1', t1.id);
    return;
  }
  const t2 = tray.w2.find(t => t.letter === letter && !r2UserSlots[r2ActiveTab].w2.some(s => s && s.id === t.id));
  if (t2) {
    handleR2TrayClick('w2', t2.id);
  }
}

export function removeR2Letter(wordKey, slotIdx) {
  handleR2SlotClick(wordKey, slotIdx);
}

// Reset current tab: empty slots and re-shuffle letters via Fisher-Yates
export function resetCurrentTabR2() {
  initR2TabTray(r2ActiveTab);
  renderR2Tab(r2ActiveTab);
}

export function checkCurrentTabR2() {
  const pair = R2_PAIRS[r2ActiveTab];
  const slots = r2UserSlots[r2ActiveTab];
  const feedback = document.getElementById('r2-feedback');

  const userW1 = slots.w1.map(t => t ? t.letter : '').join('');
  const userW2 = slots.w2.map(t => t ? t.letter : '').join('');
  const correctW1 = pair.w1.letters.join('');
  const correctW2 = pair.w2.letters.join('');

  if (userW1 === correctW1 && userW2 === correctW2) {
    r2TabCompleted[r2ActiveTab] = true;
    playSuccessFanfare();
    showItemToast('🎉', `Tahniah! Ejaan ${pair.title} tepat!`);
    speakBM(`Tahniah! Ejaan ${pair.title} tepat dan betul.`);

    updateR2TabsBar();

    // Auto-advance logic:
    // Tab 0 (Ulat Buku) -> advance after 700ms to Tab 1 (Anak Emas)
    if (r2ActiveTab === 0) {
      if (feedback) {
        feedback.className = 'feedback-banner success';
        feedback.textContent = `✅ Syabas! Ejaan "${pair.w1.jawi}" dan "${pair.w2.jawi}" tepat! Bersedia ke Tab 2 (Anak Emas)...`;
        feedback.style.display = 'block';
      }
      setTimeout(() => {
        switchR2Tab(1);
      }, 700);
      return;
    }

    // Tab 1 (Anak Emas) -> Sesi 1 completed!
    if (r2ActiveTab === 1) {
      if (r2TabCompleted[0] && r2TabCompleted[1] && gameState.r2Session === 1) {
        if (r2SessionCallback) {
          r2SessionCallback();
        }
        if (feedback) {
          feedback.className = 'feedback-banner success';
          feedback.innerHTML = `✅ Syabas! Ejaan "${pair.w1.jawi}" & "${pair.w2.jawi}" tepat!<br><strong style="color: #F59E0B;">✨ Sesi 1 Selesai! 4 Objek Sesi 2 (Buah Hati & Cahaya Mata) telah muncul di bilik!</strong>`;
          feedback.style.display = 'block';
        }
        showItemToast('✨', 'Sesi 1 Selesai! 4 Objek Sesi 2 (Buah Hati & Cahaya Mata) telah muncul di bilik!');
        speakBM('Tahniah! Sesi satu selesai. Sila kutip empat objek sesi dua di dalam bilik.');

        // Close modal after 1100ms so student can collect the next 4 items in the classroom
        setTimeout(() => {
          closeModal('room2-modal');
        }, 1100);
      }
      return;
    }

    // Tab 2 (Buah Hati) -> advance after 700ms to Tab 3 (Cahaya Mata)
    if (r2ActiveTab === 2) {
      if (feedback) {
        feedback.className = 'feedback-banner success';
        feedback.textContent = `✅ Syabas! Ejaan "${pair.w1.jawi}" dan "${pair.w2.jawi}" tepat! Bersedia ke Tab 4 (Cahaya Mata)...`;
        feedback.style.display = 'block';
      }
      setTimeout(() => {
        switchR2Tab(3);
      }, 700);
      return;
    }

    // Tab 3 (Cahaya Mata) -> All 4 completed!
    if (r2ActiveTab === 3) {
      if (r2TabCompleted.every(Boolean)) {
        gameState.room2Completed = true;
        updateMissionChecklist();
        const proceedBtn = document.getElementById('btn-proceed-r3');
        if (proceedBtn) proceedBtn.style.display = 'block';
        showItemToast('🏆', 'Semua 4 Simpulan Bahasa Berjaya Dieja!');
        speakBM('Syabas! Anda telah berjaya mengeja semua 4 simpulan bahasa Jawi dengan cemerlang.');
        if (feedback) {
          feedback.className = 'feedback-banner success';
          feedback.textContent = `🏆 Syabas! Semua 4 simpulan bahasa berjaya dieja dengan betul!`;
          feedback.style.display = 'block';
        }
      }
      return;
    }
  } else {
    gameScores.attemptsR2++;
    gameScores.room2 = Math.max(10, gameScores.room2 - 5);
    updateR2ScoreDisplay();
    playErrorBuzzer();
    if (feedback) {
      feedback.className = 'feedback-banner error';
      feedback.textContent = `❌ Ejaan masih belum tepat. Sila semak semula susunan huruf dari kanan ke kiri.`;
      feedback.style.display = 'block';
    }
    speakBM('Ejaan masih belum tepat. Sila semak susunan huruf dari kanan ke kiri.');
  }
}

export function proceedToRoom3() {
  closeModal('room2-modal');
  if (teleportCallbacks.toRoom3) {
    teleportCallbacks.toRoom3();
  }
}

// ==========================================
// 10. ROOM 3 MODAL: CANTUMAN & MAKSUD SIMPULAN BAHASA (30 Marks)
// ==========================================
const R3_MATCH_DATA = [
  {
    id: 'ulat_buku',
    jawi: 'اولت بوکو',
    rumi: 'Ulat Buku',
    icons: '🐛 📖',
    correctMeaning: 'Orang yang sangat rajin membaca buku'
  },
  {
    id: 'anak_emas',
    jawi: 'انق امس',
    rumi: 'Anak Emas',
    icons: '👶 🪙',
    correctMeaning: 'Anak atau orang yang paling disayangi'
  },
  {
    id: 'buah_hati',
    jawi: 'بواه هاتي',
    rumi: 'Buah Hati',
    icons: '🍎 💖',
    correctMeaning: 'Orang yang sangat dicintai / kesayangan'
  },
  {
    id: 'cahaya_mata',
    jawi: 'چهاي مات',
    rumi: 'Cahaya Mata',
    icons: '☀️ 👁️',
    correctMeaning: 'Anak kandung penyeri keluarga'
  }
];

const MEANING_OPTIONS = [
  'Orang yang sangat rajin membaca buku',
  'Anak atau orang yang paling disayangi',
  'Orang yang sangat dicintai / kesayangan',
  'Anak kandung penyeri keluarga'
];

export function openRoom3Modal() {
  updateR3ScoreDisplay();
  renderR3MatchingList();
  openModal('room3-modal');
}

export function updateR3ScoreDisplay() {
  const scoreEl = document.getElementById('r3-live-score');
  const attemptsEl = document.getElementById('r3-attempts');
  if (scoreEl) scoreEl.textContent = `${gameScores.room3} / 30`;
  if (attemptsEl) attemptsEl.textContent = gameScores.attemptsR3;
}

export function renderR3MatchingList() {
  const listEl = document.getElementById('idiom-matching-list');
  const feedback = document.getElementById('r3-feedback');
  if (!listEl) return;
  if (feedback) feedback.style.display = 'none';

  listEl.innerHTML = R3_MATCH_DATA.map((item, idx) => `
    <div class="idiom-match-row" id="match-row-${item.id}">
      <div class="idiom-visual-pill">
        <span class="iv-icons">${item.icons}</span>
        <span class="iv-jawi">${item.jawi}</span>
        <span class="iv-rumi">(${item.rumi})</span>
      </div>
      <select class="idiom-meaning-select" id="select-meaning-${item.id}">
        <option value="">-- Pilih Maksud Simpulan Bahasa --</option>
        ${MEANING_OPTIONS.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
      </select>
    </div>
  `).join('');
}

export function resetMatchingR3() {
  renderR3MatchingList();
}

export function checkMatchingR3() {
  const feedback = document.getElementById('r3-feedback');
  let allCorrect = true;

  R3_MATCH_DATA.forEach(item => {
    const sel = document.getElementById(`select-meaning-${item.id}`);
    const row = document.getElementById(`match-row-${item.id}`);
    if (!sel || sel.value !== item.correctMeaning) {
      allCorrect = false;
      if (row) row.style.borderColor = '#EF4444';
    } else {
      if (row) row.style.borderColor = '#10B981';
    }
  });

  if (allCorrect) {
    gameState.room3Completed = true;
    updateMissionChecklist();
    playSuccessFanfare();
    showItemToast('🎉', 'Tahniah! Semua padanan maksud simpulan bahasa tepat!');
    speakBM('Tahniah! Anda berjaya memadankan semua simpulan bahasa Jawi dengan maksud yang tepat.');
    if (feedback) {
      feedback.className = 'feedback-banner success';
      feedback.textContent = '✅ Syabas! Semua 4 simpulan bahasa telah dicantum dan dipadankan dengan sempurna!';
      feedback.style.display = 'block';
    }
    const proceedBtn = document.getElementById('btn-proceed-r4');
    if (proceedBtn) proceedBtn.style.display = 'block';
  } else {
    gameScores.attemptsR3++;
    gameScores.room3 = Math.max(10, gameScores.room3 - 5);
    updateR3ScoreDisplay();
    playErrorBuzzer();
    if (feedback) {
      feedback.className = 'feedback-banner error';
      feedback.textContent = '❌ Terdapat padanan maksud yang belum tepat. Sila semak semula.';
      feedback.style.display = 'block';
    }
    speakBM('Terdapat padanan maksud yang belum tepat. Sila cuba lagi.');
  }
}

export function proceedToRoom4() {
  closeModal('room3-modal');
  if (teleportCallbacks.toRoom4) {
    teleportCallbacks.toRoom4();
  }
}

// ==========================================
// 11. ROOM 4 MODAL: STUDIO PERSEMBAHAN SENI TULISAN JAWI (40 Marks)
// ==========================================
let khatCanvas = null;
let khatCtx = null;
let isDrawing = false;
let isEraser = false;
let strokesCanvas = null;
let khatBrushSize = 8;
let khatInkColor = '#0F172A';
let khatSelectedIdiom = 'ulat_buku';
let khatBgTheme = 'vellum';
let khatFrameStyle = 'wood';
let khatShowGuide = true;
let khatShowIcons = true;
let khatShowSeal = true;

// Custom stroke path memory
let userStrokes = [];
let currentStroke = [];

const KHAT_TEMPLATES = {
  ulat_buku: { jawi: 'اولت بوکو', rumi: 'Ulat Buku', meaning: 'Rajin Membaca', icons: '🐛 📖' },
  anak_emas: { jawi: 'انق امس', rumi: 'Anak Emas', meaning: 'Anak Kesayangan', icons: '👶 🪙' },
  buah_hati: { jawi: 'بواه هاتي', rumi: 'Buah Hati', meaning: 'Orang Tersayang', icons: '🍎 💖' },
  cahaya_mata: { jawi: 'چهاي مات', rumi: 'Cahaya Mata', meaning: 'Penyeri Keluarga', icons: '☀️ 👁️' }
};

export function setKhatTool(tool) {
  isEraser = (tool === 'eraser');
  const penBtn = document.getElementById('tool-pen');
  const eraserBtn = document.getElementById('tool-eraser');
  if (penBtn) penBtn.classList.toggle('active', !isEraser);
  if (eraserBtn) eraserBtn.classList.toggle('active', isEraser);

  if (khatCanvas) {
    khatCanvas.style.cursor = isEraser ? 'cell' : 'crosshair';
  }
}

export function setEraserMode(enabled) {
  setKhatTool(enabled ? 'eraser' : 'pen');
}

export function openRoom4Modal() {
  openModal('room4-modal');
  setKhatTool('pen');
  initKhatCanvas();
  const textEl = document.getElementById('guide-btn-text');
  if (textEl) textEl.textContent = khatShowGuide ? 'Sembunyi Garisan' : 'Tunjuk Garisan';
}

export function initKhatCanvas() {
  khatCanvas = document.getElementById('khat-canvas');
  if (!khatCanvas) return;
  khatCtx = khatCanvas.getContext('2d');

  // Attach mouse and touch listeners
  khatCanvas.onmousedown = (e) => startKhatDrawing(e);
  khatCanvas.onmousemove = (e) => continueKhatDrawing(e);
  khatCanvas.onmouseup = () => endKhatDrawing();
  khatCanvas.onmouseleave = () => endKhatDrawing();

  khatCanvas.ontouchstart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startKhatDrawing(touch);
  };
  khatCanvas.ontouchmove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    continueKhatDrawing(touch);
  };
  khatCanvas.ontouchend = () => endKhatDrawing();

  redrawKhatCanvas();
}

function getCanvasPos(e) {
  const rect = khatCanvas.getBoundingClientRect();
  const scaleX = khatCanvas.width / rect.width;
  const scaleY = khatCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function startKhatDrawing(e) {
  isDrawing = true;
  const pos = getCanvasPos(e);
  currentStroke = {
    isEraser: isEraser,
    color: khatInkColor,
    size: isEraser ? 25 : khatBrushSize,
    points: [pos]
  };
  userStrokes.push(currentStroke);
  redrawKhatCanvas();
}

function continueKhatDrawing(e) {
  if (!isDrawing || !currentStroke) return;
  const pos = getCanvasPos(e);
  currentStroke.points.push(pos);
  redrawKhatCanvas();
}

function endKhatDrawing() {
  isDrawing = false;
  currentStroke = null;
}

export function setKhatBrush(size) {
  khatBrushSize = size;
  ['brush-s', 'brush-m', 'brush-l'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  if (size === 4) document.getElementById('brush-s')?.classList.add('active');
  if (size === 8) document.getElementById('brush-m')?.classList.add('active');
  if (size === 16) document.getElementById('brush-l')?.classList.add('active');
  setKhatTool('pen');
}

export function setKhatInk(color, btnEl) {
  khatInkColor = color;
  document.querySelectorAll('.khat-color-dot').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  setKhatTool('pen');
}

export function selectKhatIdiom(idiomId) {
  khatSelectedIdiom = idiomId;
  document.querySelectorAll('.khat-idiom-choice').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
  userStrokes = []; // Clear canvas for new idiom
  if (strokesCanvas) {
    const sCtx = strokesCanvas.getContext('2d');
    sCtx.clearRect(0, 0, strokesCanvas.width, strokesCanvas.height);
  }
  redrawKhatCanvas();
}

export function toggleTracingGuide() {
  khatShowGuide = !khatShowGuide;
  const textEl = document.getElementById('guide-btn-text');
  if (textEl) textEl.textContent = khatShowGuide ? 'Sembunyi Garisan' : 'Tunjuk Garisan';
  redrawKhatCanvas();
}

export function clearKhatDrawing() {
  userStrokes = [];
  if (strokesCanvas) {
    const sCtx = strokesCanvas.getContext('2d');
    sCtx.clearRect(0, 0, strokesCanvas.width, strokesCanvas.height);
  }
  redrawKhatCanvas();
}

export function autoCalligraphyStencil() {
  playSuccessFanfare();
  showItemToast('✨', 'Khat Automatik Berjaya Dikemaskan!');
  const tmpl = KHAT_TEMPLATES[khatSelectedIdiom];

  // Stamp master-grade calligraphy strokes
  userStrokes.push({
    isStencil: true,
    jawi: tmpl.jawi,
    color: khatInkColor
  });

  redrawKhatCanvas();
}

export function setCanvasBackgroundTheme(theme) {
  khatBgTheme = theme;
  ['bg-opt-vellum', 'bg-opt-songket', 'bg-opt-batik', 'bg-opt-night'].forEach(id => {
    document.getElementById(id)?.classList.remove('active');
  });
  document.getElementById(`bg-opt-${theme}`)?.classList.add('active');
  redrawKhatCanvas();
}

export function setCanvasFrameStyle(style) {
  khatFrameStyle = style;
  ['frame-opt-wood', 'frame-opt-gold', 'frame-opt-modern'].forEach(id => {
    document.getElementById(id)?.classList.remove('active');
  });
  document.getElementById(`frame-opt-${style}`)?.classList.add('active');

  const wrapper = document.getElementById('khat-canvas-wrapper');
  if (wrapper) {
    wrapper.className = `khat-canvas-wrapper frame-${style}`;
  }
}

export function toggleDecorativeIcons(checked) {
  khatShowIcons = checked;
  redrawKhatCanvas();
}

export function toggleArtistSeal(checked) {
  khatShowSeal = checked;
  redrawKhatCanvas();
}

// Master Redraw Engine
export function redrawKhatCanvas() {
  if (!khatCtx || !khatCanvas) return;
  const w = khatCanvas.width;
  const h = khatCanvas.height;

  // 1. Draw Background Theme
  if (khatBgTheme === 'vellum') {
    const grad = khatCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#FFFDF0');
    grad.addColorStop(1, '#FEF3C7');
    khatCtx.fillStyle = grad;
    khatCtx.fillRect(0, 0, w, h);
  } else if (khatBgTheme === 'songket') {
    const grad = khatCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#064E3B');
    grad.addColorStop(1, '#022C22');
    khatCtx.fillStyle = grad;
    khatCtx.fillRect(0, 0, w, h);
  } else if (khatBgTheme === 'batik') {
    const grad = khatCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#FDF2F8');
    grad.addColorStop(1, '#EDE9FE');
    khatCtx.fillStyle = grad;
    khatCtx.fillRect(0, 0, w, h);
  } else {
    // night
    const grad = khatCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E1B4B');
    khatCtx.fillStyle = grad;
    khatCtx.fillRect(0, 0, w, h);
  }

  // 2. Draw Decorative Border Frame
  khatCtx.strokeStyle = (khatBgTheme === 'songket' || khatBgTheme === 'night') ? '#F59E0B' : '#78350F';
  khatCtx.lineWidth = 8;
  khatCtx.strokeRect(10, 10, w - 20, h - 20);

  khatCtx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  khatCtx.lineWidth = 2;
  khatCtx.strokeRect(18, 18, w - 36, h - 36);

  const tmpl = KHAT_TEMPLATES[khatSelectedIdiom];

  // 3. Draw Tracing Guide (Surihan) if enabled
  if (khatShowGuide) {
    khatCtx.save();
    khatCtx.font = 'bold 118px "Amiri", serif';
    khatCtx.textAlign = 'center';
    khatCtx.textBaseline = 'middle';
    khatCtx.strokeStyle = (khatBgTheme === 'songket' || khatBgTheme === 'night') ? 'rgba(253, 230, 138, 0.35)' : 'rgba(100, 116, 139, 0.28)';
    khatCtx.lineWidth = 3;
    khatCtx.setLineDash([8, 8]);
    khatCtx.strokeText(tmpl.jawi, w / 2, h / 2 - 10);
    khatCtx.restore();
  }

  // 4. Draw User Calligraphy Strokes (supports Pen & realistic Pemadam eraser)
  if (!strokesCanvas) {
    strokesCanvas = document.createElement('canvas');
  }
  if (strokesCanvas.width !== w || strokesCanvas.height !== h) {
    strokesCanvas.width = w;
    strokesCanvas.height = h;
  }
  const sCtx = strokesCanvas.getContext('2d');
  sCtx.clearRect(0, 0, w, h);

  userStrokes.forEach(stroke => {
    if (stroke.isStencil) {
      sCtx.save();
      sCtx.globalCompositeOperation = 'source-over';
      sCtx.font = 'bold 124px "Amiri", serif';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.fillStyle = stroke.color;
      sCtx.shadowColor = 'rgba(0,0,0,0.2)';
      sCtx.shadowBlur = 8;
      sCtx.fillText(stroke.jawi, w / 2, h / 2 - 10);
      sCtx.restore();
    } else if (stroke.points && stroke.points.length > 0) {
      sCtx.save();
      if (stroke.isEraser) {
        sCtx.globalCompositeOperation = 'destination-out';
        sCtx.lineWidth = 25;
      } else {
        sCtx.globalCompositeOperation = 'source-over';
        sCtx.strokeStyle = stroke.color;
        sCtx.lineWidth = stroke.size;
      }
      sCtx.lineCap = 'round';
      sCtx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        sCtx.beginPath();
        sCtx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.isEraser ? 25 : stroke.size) / 2, 0, Math.PI * 2);
        if (stroke.isEraser) {
          sCtx.fill();
        } else {
          sCtx.fillStyle = stroke.color;
          sCtx.fill();
        }
      } else {
        sCtx.beginPath();
        sCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          sCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        sCtx.stroke();
      }
      sCtx.restore();
    }
  });

  // Stamp calligraphy strokes onto the main canvas
  khatCtx.save();
  khatCtx.globalCompositeOperation = 'source-over';
  khatCtx.drawImage(strokesCanvas, 0, 0);
  khatCtx.restore();

  // Set active tool operation on khatCtx
  if (isEraser) {
    khatCtx.globalCompositeOperation = 'destination-out';
    khatCtx.lineWidth = 25;
  } else {
    khatCtx.globalCompositeOperation = 'source-over';
    khatCtx.lineWidth = khatBrushSize;
    khatCtx.strokeStyle = khatInkColor;
  }

  // 5. Subtitle & Idiom Meaning
  khatCtx.save();
  khatCtx.font = 'bold 20px "Fredoka", sans-serif';
  khatCtx.textAlign = 'center';
  khatCtx.fillStyle = (khatBgTheme === 'songket' || khatBgTheme === 'night') ? '#FDE68A' : '#78350F';
  khatCtx.fillText(`Simpulan Bahasa: ${tmpl.rumi} (${tmpl.meaning})`, w / 2, h - 35);
  khatCtx.restore();

  // 6. Draw Visual Icons if enabled
  if (khatShowIcons) {
    khatCtx.save();
    khatCtx.font = '36px sans-serif';
    khatCtx.fillText(tmpl.icons, 40, 56);
    khatCtx.restore();
  }

  // 7. Draw Royal Artist Wax Seal if enabled
  if (khatShowSeal) {
    khatCtx.save();
    const sx = w - 55, sy = h - 55;
    khatCtx.beginPath();
    khatCtx.arc(sx, sy, 26, 0, Math.PI * 2);
    khatCtx.fillStyle = '#DC2626';
    khatCtx.fill();
    khatCtx.strokeStyle = '#B91C1C';
    khatCtx.lineWidth = 3;
    khatCtx.stroke();

    khatCtx.font = 'bold 18px "Amiri", serif';
    khatCtx.textAlign = 'center';
    khatCtx.textBaseline = 'middle';
    khatCtx.fillStyle = '#FEF08A';
    khatCtx.fillText('خت', sx, sy);
    khatCtx.restore();
  }
}

export function finalizeAndExhibitArtwork() {
  if (!khatCanvas) return;
  const dataUrl = khatCanvas.toDataURL('image/png');

  // Update 3D Masterpiece Easel in Room 4
  if (updateEaselCallback) {
    updateEaselCallback(dataUrl);
  }

  // Award 40 Marks for Room 4
  gameScores.room4 = 40;
  gameState.room4Completed = true;
  updateMissionChecklist();
  playSuccessFanfare();

  // Save to Firebase Firestore Live Gallery
  saveArtworkToDB(studentProfile.name, studentProfile.class, dataUrl)
    .then((docId) => {
      showItemToast('🖼️', 'Karya berjaya disimpan ke pangkalan data!');
    })
    .catch((err) => {
      console.warn('Firestore artwork save notice:', err);
    });

  closeModal('room4-modal');
  showFinalPBDReport(dataUrl);
}

// ==========================================
// 12. FINAL PBD REPORT CARD (report-modal)
// ==========================================
export function showFinalPBDReport(dataUrl = null) {
  const nameEl = document.getElementById('report-student-name');
  const classEl = document.getElementById('report-student-class');
  const dateEl = document.getElementById('report-date');
  const imgEl = document.getElementById('report-khat-img');
  const badgeEl = document.getElementById('report-tp-badge');
  const rubricEl = document.getElementById('report-rubric-desc');

  if (nameEl) nameEl.textContent = studentProfile.name;
  if (classEl) classEl.textContent = studentProfile.class;
  if (dateEl) {
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  if (imgEl) {
    imgEl.src = dataUrl || (khatCanvas ? khatCanvas.toDataURL('image/png') : '');
  }

  // Score breakdown elements
  const scoreR2El = document.getElementById('report-score-r2');
  const scoreR3El = document.getElementById('report-score-r3');
  const scoreR4El = document.getElementById('report-score-r4');
  const scoreTotalEl = document.getElementById('report-score-total');

  if (scoreR2El) scoreR2El.textContent = `${gameScores.room2} / 30`;
  if (scoreR3El) scoreR3El.textContent = `${gameScores.room3} / 30`;
  if (scoreR4El) scoreR4El.textContent = `${gameScores.room4} / 40`;

  const totalScore = gameScores.total();
  if (scoreTotalEl) scoreTotalEl.textContent = `${totalScore} / 100`;

  // Compute Dynamic TP Level (TP3 - TP6)
  if (badgeEl && rubricEl) {
    badgeEl.className = 'tp-badge-large';
    if (totalScore >= 85) {
      badgeEl.classList.add('tp6');
      badgeEl.textContent = 'Tahap Penguasaan 6 (Cemerlang)';
      rubricEl.innerHTML = `<strong>Tahap Penguasaan 6 (Cemerlang):</strong> Murid berupaya menulis simpulan bahasa dalam Jawi dengan ejaan tepat dan mempersembahkan keindahan seni tulisan Jawi menggunakan corak dan bingkai yang sangat kreatif mengikut Standard Pembelajaran 4.4.1 dan 4.4.2.`;
    } else if (totalScore >= 70) {
      badgeEl.classList.add('tp5');
      badgeEl.textContent = 'Tahap Penguasaan 5 (Sangat Baik)';
      rubricEl.innerHTML = `<strong>Tahap Penguasaan 5 (Sangat Baik):</strong> Murid berupaya mengeja perkataan Jawi, mencantum simpulan bahasa, dan mempersembahkan seni khat dengan kemas dan teratur mengikut Standard Pembelajaran 4.4.1 dan 4.4.2.`;
    } else if (totalScore >= 50) {
      badgeEl.classList.add('tp4');
      badgeEl.textContent = 'Tahap Penguasaan 4 (Baik)';
      rubricEl.innerHTML = `<strong>Tahap Penguasaan 4 (Baik):</strong> Murid menguasai asas ejaan dan cantuman simpulan bahasa serta melukis kaligrafi dengan bimbingan minimum mengikut Standard Pembelajaran 4.4.1 dan 4.4.2.`;
    } else {
      badgeEl.classList.add('tp3');
      badgeEl.textContent = 'Tahap Penguasaan 3 (Memuaskan)';
      rubricEl.innerHTML = `<strong>Tahap Penguasaan 3 (Memuaskan):</strong> Murid berupaya mengeja dan mempersembahkan seni Jawi pada tahap memuaskan mengikut Standard Pembelajaran 4.4.1 dan 4.4.2.`;
    }
  }

  openModal('report-modal');
}

/**
 * Direct Client-Side PDF Download of PBD Report Card using html2pdf.js
 * Generates an authentic Sijil_PBD_Jawi_[Nama_Murid].pdf directly to Downloads.
 */
export async function downloadPBDReportPDF() {
  const reportCard = document.getElementById('report-view');
  if (!reportCard) return;

  const imgEl = document.getElementById('report-khat-img');
  if (imgEl && (!imgEl.src || imgEl.src === '' || imgEl.src === window.location.href) && khatCanvas) {
    try {
      imgEl.src = khatCanvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Canvas toDataURL failed:', e);
    }
  }

  const btn = document.getElementById('btn-download-pdf');
  const origText = btn ? btn.innerHTML : '📥 Simpan Sijil (PDF)';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Menjana Sijil PDF...';
  }

  const rawName = (studentProfile?.name || 'Murid').trim();
  const cleanName = rawName.replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '_');
  const filename = `Sijil_PBD_Jawi_${cleanName || 'Murid_Bestari'}.pdf`;

  if (typeof html2pdf !== 'undefined') {
    try {
      const opt = {
        margin: [6, 6, 6, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          scrollX: 0,
          scrollY: 0,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
      };

      await html2pdf().set(opt).from(reportCard).save();
      showItemToast('📄', `Sijil PBD berjaya disimpan: ${filename}`);
      speakBM('Tahniah! Sijil PBD anda telah berjaya dimuat turun.');
    } catch (err) {
      console.warn('html2pdf generation error, falling back to window.print():', err);
      printPBDReport();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }
  } else {
    printPBDReport();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

export function printPBDReport() {
  const imgEl = document.getElementById('report-khat-img');
  if (imgEl && (!imgEl.src || imgEl.src === '' || imgEl.src === window.location.href) && khatCanvas) {
    try {
      imgEl.src = khatCanvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Canvas toDataURL failed:', e);
    }
  }

  const modalEl = document.getElementById('report-modal');
  if (modalEl) modalEl.classList.add('active');

  setTimeout(() => {
    window.print();
  }, 120);
}

export function restartGame() {
  location.reload();
}

// ==========================================
// 13. LIVE ARTWORK GALLERY (Firebase Firestore)
// ==========================================
let cachedGalleryArtworks = [];

export async function openGallerySidebar() {
  const sidebar = document.getElementById('gallery-sidebar');
  const backdrop = document.getElementById('gallery-sidebar-backdrop');
  if (sidebar) sidebar.classList.add('open');
  if (backdrop) backdrop.classList.add('open');

  await refreshGalleryArtworks();
}

export function closeGallerySidebar() {
  const sidebar = document.getElementById('gallery-sidebar');
  const backdrop = document.getElementById('gallery-sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

let galleryLastVisibleDoc = null;
let galleryHasMore = false;
let isGalleryLoadingMore = false;

function buildGalleryCardHtml(item, idx) {
  const safeName = (item.studentName || 'Murid Bestari').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeClass = (item.studentClass || '4 Inovatif').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let dateStr = '';
  if (item.timestamp && item.timestamp.toDate) {
    dateStr = item.timestamp.toDate().toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  } else if (item.createdAt) {
    dateStr = new Date(item.createdAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return `
    <div class="gallery-card" onclick="openGalleryPreview(${idx})" title="Klik untuk paparan skrin penuh">
      <img src="${item.image}" alt="Karya Seni ${safeName}" class="gallery-card-thumb" loading="lazy" />
      <div class="gallery-card-info">
        <strong class="gallery-card-name">${safeName}</strong>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px;">
          <span class="gallery-card-class">🏫 ${safeClass}</span>
          ${dateStr ? `<span class="gallery-card-date">${dateStr}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function updateGalleryPaginationControls() {
  const loadMoreBtn = document.getElementById('btn-gallery-load-more');
  const noMoreEl = document.getElementById('gallery-no-more');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = galleryHasMore ? 'block' : 'none';
  }
  if (noMoreEl) {
    noMoreEl.style.display = (!galleryHasMore && cachedGalleryArtworks.length > 0) ? 'block' : 'none';
  }
}

export async function refreshGalleryArtworks() {
  const grid = document.getElementById('gallery-grid');
  const countBadge = document.getElementById('gallery-count-badge');
  if (!grid) return;

  grid.innerHTML = `
    <div class="gallery-loading">
      <div class="gallery-spinner"></div>
      <p>Memuatkan karya dari pangkalan data...</p>
    </div>
  `;

  galleryLastVisibleDoc = null;
  galleryHasMore = false;
  updateGalleryPaginationControls();

  try {
    const res = await fetchGalleryArtworks(10, null);
    cachedGalleryArtworks = res.artworks || [];
    galleryLastVisibleDoc = res.lastVisibleDoc;
    galleryHasMore = res.hasMore;

    if (typeof window !== 'undefined') {
      window._cachedGalleryArtworks = cachedGalleryArtworks;
    }

    if (countBadge) {
      countBadge.textContent = `${cachedGalleryArtworks.length} Karya Terpamer`;
    }

    if (cachedGalleryArtworks.length === 0) {
      grid.innerHTML = `
        <div class="gallery-empty">
          <span style="font-size: 36px;">🎨</span>
          <p><strong>Belum ada karya terpamer.</strong></p>
          <p style="font-size: 12px; color: #64748B;">Selesaikan lukisan khat di Bilik 4 dan tekan <em>"Pamerkan di Galeri 3D"</em> untuk melihat hasil seni anda di sini!</p>
        </div>
      `;
      updateGalleryPaginationControls();
      return;
    }

    grid.innerHTML = cachedGalleryArtworks.map((item, idx) => buildGalleryCardHtml(item, idx)).join('');
    updateGalleryPaginationControls();
  } catch (err) {
    console.error('Error refreshing gallery artworks:', err);
    grid.innerHTML = `
      <div class="gallery-error">
        <span style="font-size: 32px;">⚠️</span>
        <p>Gagal memuatkan galeri pameran.</p>
        <button class="btn-secondary" onclick="refreshGalleryArtworks()" style="margin-top: 8px;">Cuba Semula</button>
      </div>
    `;
    updateGalleryPaginationControls();
  }
}

export async function loadMoreGalleryArtworks() {
  if (isGalleryLoadingMore || !galleryHasMore || !galleryLastVisibleDoc) return;
  const grid = document.getElementById('gallery-grid');
  const loadMoreBtn = document.getElementById('btn-gallery-load-more');
  const countBadge = document.getElementById('gallery-count-badge');

  isGalleryLoadingMore = true;
  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = '⏳ Memuatkan...';
  }

  try {
    const res = await fetchGalleryArtworks(10, galleryLastVisibleDoc);
    const newItems = res.artworks || [];
    const startIndex = cachedGalleryArtworks.length;
    cachedGalleryArtworks.push(...newItems);
    galleryLastVisibleDoc = res.lastVisibleDoc;
    galleryHasMore = res.hasMore;

    if (typeof window !== 'undefined') {
      window._cachedGalleryArtworks = cachedGalleryArtworks;
    }

    if (countBadge) {
      countBadge.textContent = `${cachedGalleryArtworks.length} Karya Terpamer`;
    }

    if (grid && newItems.length > 0) {
      const newHtml = newItems.map((item, idx) => buildGalleryCardHtml(item, startIndex + idx)).join('');
      grid.insertAdjacentHTML('beforeend', newHtml);
    }
  } catch (err) {
    console.error('Error loading more artworks:', err);
    showItemToast('⚠️', 'Gagal memuatkan karya tambahan.');
  } finally {
    isGalleryLoadingMore = false;
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.innerHTML = '📥 Muat Lebih Banyak (10 Karya)';
    }
    updateGalleryPaginationControls();
  }
}

export function openGalleryPreview(indexOrData) {
  let item = null;
  if (typeof indexOrData === 'number') {
    item = cachedGalleryArtworks[indexOrData] || (window._cachedGalleryArtworks ? window._cachedGalleryArtworks[indexOrData] : null);
  } else if (typeof indexOrData === 'object') {
    item = indexOrData;
  }
  if (!item) return;

  const nameEl = document.getElementById('preview-student-name');
  const classEl = document.getElementById('preview-student-class');
  const imgEl = document.getElementById('preview-artwork-img');

  if (nameEl) nameEl.textContent = item.studentName || 'Murid Bestari';
  if (classEl) {
    let dateStr = '';
    if (item.timestamp && item.timestamp.toDate) {
      dateStr = item.timestamp.toDate().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (item.createdAt) {
      dateStr = new Date(item.createdAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    classEl.textContent = `${item.studentClass || '4 Inovatif'}${dateStr ? ' • ' + dateStr : ''}`;
  }
  if (imgEl) {
    imgEl.src = item.image || '';
  }

  openModal('gallery-preview-modal');
}

// ==========================================
// 14. GLOBAL BINDINGS FOR HTML ONCLICK COMPATIBILITY
// ==========================================
if (typeof window !== 'undefined') {
  // Main Menu, Home & Kamus Controls
  window.startMainGame = startMainGame;
  window.confirmReturnToLobby = confirmReturnToLobby;
  window.openKamusModal = openKamusModal;
  window.insertKamusPrompt = insertKamusPrompt;
  window.clearKamusInput = clearKamusInput;
  window.copyKamusJawi = copyKamusJawi;
  window.speakKamusJawi = speakKamusJawi;
  window.transliterateRumiToJawi = transliterateRumiToJawi;
  window.toggleMissionChecklist = toggleMissionChecklist;
  window.updateMissionChecklist = updateMissionChecklist;
  window.loadKamusData = loadKamusData;

  window.openIntroModal = openIntroModal;
  window.openProfileModal = openProfileModal;
  window.saveProfile = saveProfile;
  window.toggleVoiceover = toggleVoiceover;
  window.handleCurrentInteraction = handleCurrentInteraction;
  window.closeModal = closeModal;
  window.handleOverlayClick = handleOverlayClick;

  // Live Gallery
  window.openGallerySidebar = openGallerySidebar;
  window.closeGallerySidebar = closeGallerySidebar;
  window.refreshGalleryArtworks = refreshGalleryArtworks;
  window.openGalleryPreview = openGalleryPreview;

  // Room 1
  window.openRoom1Modal = openRoom1Modal;
  window.quickCollectR1 = quickCollectR1;
  window.replayRoom1 = replayRoom1;
  window.proceedToRoom2 = proceedToRoom2;

  // Room 2
  window.openRoom2Modal = openRoom2Modal;
  window.switchR2Tab = switchR2Tab;
  window.addR2Letter = addR2Letter;
  window.removeR2Letter = removeR2Letter;
  window.resetCurrentTabR2 = resetCurrentTabR2;
  window.checkCurrentTabR2 = checkCurrentTabR2;
  window.proceedToRoom3 = proceedToRoom3;
  window.handleR2DragStart = handleR2DragStart;
  window.handleR2DragEnd = handleR2DragEnd;
  window.handleR2DragOver = handleR2DragOver;
  window.handleR2DragLeave = handleR2DragLeave;
  window.handleR2Drop = handleR2Drop;
  window.handleR2DropToTray = handleR2DropToTray;
  window.handleR2TrayClick = handleR2TrayClick;
  window.handleR2SlotClick = handleR2SlotClick;

  // Room 3
  window.openRoom3Modal = openRoom3Modal;
  window.resetMatchingR3 = resetMatchingR3;
  window.checkMatchingR3 = checkMatchingR3;
  window.proceedToRoom4 = proceedToRoom4;

  // Room 4
  window.openRoom4Modal = openRoom4Modal;
  window.setKhatTool = setKhatTool;
  window.setEraserMode = setEraserMode;
  window.setKhatBrush = setKhatBrush;
  window.setKhatInk = setKhatInk;
  window.selectKhatIdiom = selectKhatIdiom;
  window.toggleTracingGuide = toggleTracingGuide;
  window.clearKhatDrawing = clearKhatDrawing;
  window.autoCalligraphyStencil = autoCalligraphyStencil;
  window.setCanvasBackgroundTheme = setCanvasBackgroundTheme;
  window.setCanvasFrameStyle = setCanvasFrameStyle;
  window.toggleDecorativeIcons = toggleDecorativeIcons;
  window.toggleArtistSeal = toggleArtistSeal;
  window.finalizeAndExhibitArtwork = finalizeAndExhibitArtwork;

  // Gallery Pagination
  window.loadMoreGalleryArtworks = loadMoreGalleryArtworks;

  // Final PBD Report
  window.showFinalPBDReport = showFinalPBDReport;
  window.downloadPBDReportPDF = downloadPBDReportPDF;
  window.printPBDReport = printPBDReport;
  window.restartGame = restartGame;
}

// ==========================================
// 14. MOBILE TOUCH & MOUSE VIRTUAL JOYSTICK
// ==========================================
export function initVirtualJoystick() {
  const zone = document.getElementById('joystick-zone');
  const base = document.getElementById('joystick-base');
  const knob = document.getElementById('joystick-knob');
  if (!zone || !base || !knob) return;

  const MAX_RADIUS = 38;
  let activeTouchId = null;
  let isDragging = false;

  const getBaseCenter = () => {
    const rect = base.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const updateJoystick = (clientX, clientY) => {
    const center = getBaseCenter();
    let dx = clientX - center.x;
    let dy = clientY - center.y;
    const distance = Math.hypot(dx, dy);

    if (distance > MAX_RADIUS) {
      dx = (dx / distance) * MAX_RADIUS;
      dy = (dy / distance) * MAX_RADIUS;
    }

    knob.style.transform = `translate(${dx}px, ${dy}px)`;

    // Map output directly to joystickVector X and Z (-1.0 to 1.0)
    joystickVector.x = dx / MAX_RADIUS;
    joystickVector.z = dy / MAX_RADIUS;
    joystickVector.active = true;
  };

  const resetJoystick = () => {
    knob.style.transform = 'translate(0px, 0px)';
    joystickVector.x = 0;
    joystickVector.z = 0;
    joystickVector.active = false;
    activeTouchId = null;
    isDragging = false;
  };

  // Touch Handlers for Tablets & Phones
  zone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    activeTouchId = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        e.preventDefault();
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  }, { passive: false });

  const handleTouchEnd = (e) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        resetJoystick();
        break;
      }
    }
  };

  window.addEventListener('touchend', handleTouchEnd, { passive: false });
  window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  // Mouse Handlers for Desktop Simulation
  zone.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    updateJoystick(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateJoystick(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) resetJoystick();
  });

  window.addEventListener('blur', () => {
    resetJoystick();
    keys.w = false; keys.s = false; keys.a = false; keys.d = false;
    keys.ArrowUp = false; keys.ArrowDown = false; keys.ArrowLeft = false; keys.ArrowRight = false;
  });
}

initVirtualJoystick();
