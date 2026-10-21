// ==========================================
// UI.JS - DOM Manipulations, Audio, Trialogical Modals & PBD Report (DSKP SP 4.4.2)
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
  keys
} from './state.js?v=4.4.2';

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

// ==========================================
// 1. AUDIO SYNTHESIZER (Web Audio API)
// ==========================================
const audioCtx = (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

export function playTone(freq, type = 'sine', duration = 0.2, delay = 0) {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime + delay);
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
// 1.5 BAHASA MELAYU VOICEOVER (SpeechSynthesis)
// ==========================================
let isVoiceMuted = false;

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
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[-•—_]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ms-MY';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const msVoice = voices.find(v => v.lang === 'ms-MY' || v.lang === 'ms' || v.lang.startsWith('id'));
    if (msVoice) utterance.voice = msVoice;

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech error', e);
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
  if (!invSlotsContainer) return;
  invSlotsContainer.innerHTML = '';

  const room = gameState.currentRoom;

  if (room === 'lobby') {
    if (invTitleTextEl) invTitleTextEl.textContent = 'Dataran Sekolah';
    if (invCountEl) invCountEl.textContent = 'Bersedia';
    invSlotsContainer.innerHTML = `
      <div class="slot-item unlocked" style="width: auto; padding: 0 12px; gap: 4px;">
        <span class="slot-char">🏫</span>
        <span class="slot-label">Sedia Meneroka</span>
      </div>
    `;
    return;
  }

  if (room === 'room1') {
    const collected = COLLECTIBLES_R1.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Pagar Sesat Jawi';
    if (invCountEl) invCountEl.textContent = `${collected} / 10 Pos`;

    COLLECTIBLES_R1.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `slot-item jawi-char ${item.collected ? 'unlocked' : ''}`;
      slot.id = `inv-${item.id}`;
      slot.title = `Pos ${item.stepIndex}: ${item.char}`;
      slot.innerHTML = `
        <span class="slot-char">${item.collected ? item.stepIndex : '?'}</span>
        <span class="slot-label">${item.collected ? 'Ditemui' : 'Pos ' + item.stepIndex}</span>
      `;
      invSlotsContainer.appendChild(slot);
    });
    return;
  }

  if (room === 'room2') {
    const collected = COLLECTIBLES_R2.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Makmal Kata Visual';
    if (invCountEl) invCountEl.textContent = `${collected} / 8 Jubin`;

    COLLECTIBLES_R2.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `slot-item jawi-char ${item.collected ? 'unlocked' : ''}`;
      slot.id = `inv-${item.id}`;
      slot.title = `Jubin: ${item.name} (${item.jawi})`;
      slot.innerHTML = `
        <span class="slot-char">${item.collected ? item.char : '?'}</span>
        <span class="slot-label">${item.rumi}</span>
      `;
      invSlotsContainer.appendChild(slot);
    });
    return;
  }

  if (room === 'room3') {
    const collected = COLLECTIBLES_R3.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Arkib Simpulan Bahasa';
    if (invCountEl) invCountEl.textContent = `${collected} / 4 Gulungan`;

    COLLECTIBLES_R3.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `slot-item ${item.collected ? 'unlocked' : ''}`;
      slot.id = `inv-${item.id}`;
      slot.title = `${item.label} (${item.jawi})`;
      slot.innerHTML = `
        <span class="slot-char">${item.collected ? '📜' : '?'}</span>
        <span class="slot-label">${item.label}</span>
      `;
      invSlotsContainer.appendChild(slot);
    });
    return;
  }

  if (room === 'room4') {
    const collected = COLLECTIBLES_R4.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Studio Seni Khat';
    if (invCountEl) invCountEl.textContent = `${collected} / 3 Alatan`;

    COLLECTIBLES_R4.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `slot-item ${item.collected ? 'unlocked' : ''}`;
      slot.id = `inv-${item.id}`;
      slot.title = `${item.label}: ${item.desc}`;
      slot.innerHTML = `
        <span class="slot-char">${item.collected ? item.char : '?'}</span>
        <span class="slot-label">${item.label}</span>
      `;
      invSlotsContainer.appendChild(slot);
    });
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
    speakBM(`Pos ${item.stepIndex}. Kumpulan huruf Jawi: ${item.name}`);
    const count = COLLECTIBLES_R1.filter(c => c.collected).length;
    if (count === 10) {
      gameState.room1Completed = true;
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
  studentProfile.class = classVal || '3 Inovatif';

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
    showItemToast('👩‍🏫', `Cikgu Aminah: "Selamat datang, ${studentProfile.name}! Sedia meneroka keindahan seni Jawi di Sekolah Bestari?"`);
    openProfileModal();
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
      if (isStepCollected) {
        card.classList.add('speaking');
        playTone(587.33, 'triangle', 0.15);
        speakBM(`Huruf Jawi: ${item.name}. Padanan Rumi: ${item.rumi}`);
        setTimeout(() => card.classList.remove('speaking'), 800);
      } else {
        playErrorBuzzer();
        showItemToast('🔒', `Huruf ini berada di Pos ${item.step} dalam pagar sesat!`);
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
    w2: { id: 'buku', name: 'Buku', rumi: 'BUKU', char: '📖', jawi: 'بوکو', letters: ['ب', 'و', 'ک', 'و'] },
    pool: ['ا', 'و', 'ل', 'ت', 'ب', 'و', 'ک', 'و']
  },
  {
    tabIdx: 1,
    title: 'Anak & Emas (Anak Emas)',
    w1: { id: 'anak', name: 'Anak / Bayi', rumi: 'ANAK', char: '👶', jawi: 'انق', letters: ['ا', 'ن', 'ق'] },
    w2: { id: 'emas', name: 'Jongkong Emas', rumi: 'EMAS', char: '🪙', jawi: 'امس', letters: ['ا', 'م', 'س'] },
    pool: ['ا', 'ن', 'ق', 'ا', 'م', 'س']
  },
  {
    tabIdx: 2,
    title: 'Buah & Hati (Buah Hati)',
    w1: { id: 'buah', name: 'Buah Epal', rumi: 'BUAH', char: '🍎', jawi: 'بواه', letters: ['ب', 'و', 'ا', 'ه'] },
    w2: { id: 'hati', name: 'Hati / Kasih', rumi: 'HATI', char: '💖', jawi: 'هاتي', letters: ['ه', 'ا', 'ت', 'ي'] },
    pool: ['ب', 'و', 'ا', 'ه', 'ه', 'ا', 'ت', 'ي']
  },
  {
    tabIdx: 3,
    title: 'Cahaya & Mata (Cahaya Mata)',
    w1: { id: 'cahaya', name: 'Cahaya Suria', rumi: 'CAHAYA', char: '☀️', jawi: 'چهاي', letters: ['چ', 'ه', 'ا', 'ي'] },
    w2: { id: 'mata', name: 'Mata', rumi: 'MATA', char: '👁️', jawi: 'مات', letters: ['م', 'ا', 'ت'] },
    pool: ['چ', 'ه', 'ا', 'ي', 'م', 'ا', 'ت']
  }
];

let r2ActiveTab = 0;
let r2TabCompleted = [false, false, false, false];
let r2UserSlots = [
  { w1: [null, null, null, null], w2: [null, null, null, null] },
  { w1: [null, null, null], w2: [null, null, null] },
  { w1: [null, null, null, null], w2: [null, null, null, null] },
  { w1: [null, null, null, null], w2: [null, null, null] }
];

export function openRoom2Modal() {
  updateR2ScoreDisplay();
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
  r2ActiveTab = tabIdx;
  document.querySelectorAll('.r2-tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === tabIdx);
  });
  renderR2Tab(tabIdx);
}

export function renderR2Tab(tabIdx) {
  const contentEl = document.getElementById('r2-tab-content');
  const feedback = document.getElementById('r2-feedback');
  if (!contentEl) return;
  if (feedback) feedback.style.display = 'none';

  const pair = R2_PAIRS[tabIdx];
  const slots = r2UserSlots[tabIdx];
  const isDone = r2TabCompleted[tabIdx];

  // Calculate remaining pool letters
  const usedLetters = [...slots.w1, ...slots.w2].filter(Boolean);
  const remainingPool = [...pair.pool];
  usedLetters.forEach(l => {
    const idx = remainingPool.indexOf(l);
    if (idx !== -1) remainingPool.splice(idx, 1);
  });

  contentEl.innerHTML = `
    <div class="r2-words-layout">
      <!-- Word 1 -->
      <div class="r2-word-card">
        <div class="r2-word-illus">${pair.w1.char}</div>
        <div class="r2-word-title">${pair.w1.rumi} (${pair.w1.name})</div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">Ejaan Jawi (Kanan ke Kiri &larr;):</div>
        <div class="rtl-letter-slots">
          ${pair.w1.letters.map((_, sIdx) => `
            <div class="rtl-letter-slot ${slots.w1[sIdx] ? 'filled' : ''}" onclick="removeR2Letter('w1', ${sIdx})">
              ${slots.w1[sIdx] || ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Word 2 -->
      <div class="r2-word-card">
        <div class="r2-word-illus">${pair.w2.char}</div>
        <div class="r2-word-title">${pair.w2.rumi} (${pair.w2.name})</div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">Ejaan Jawi (Kanan ke Kiri &larr;):</div>
        <div class="rtl-letter-slots">
          ${pair.w2.letters.map((_, sIdx) => `
            <div class="rtl-letter-slot ${slots.w2[sIdx] ? 'filled' : ''}" onclick="removeR2Letter('w2', ${sIdx})">
              ${slots.w2[sIdx] || ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Letter Bank Pool -->
    <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; text-align: left;">
      Dulang Huruf Jawi (Klik untuk masukkan ke petak):
    </div>
    <div class="letters-pool">
      ${remainingPool.length === 0 ? '<span style="font-size: 12px; color: #94A3B8;">Semua huruf telah dimasukkan ke dalam petak ejaan.</span>' : ''}
      ${remainingPool.map((letter, pIdx) => `
        <div class="pool-letter-tile" onclick="addR2Letter('${letter}')">${letter}</div>
      `).join('')}
    </div>
  `;
}

export function addR2Letter(letter) {
  const pair = R2_PAIRS[r2ActiveTab];
  const slots = r2UserSlots[r2ActiveTab];

  // Try slotting into Word 1 first, then Word 2
  const emptyW1 = slots.w1.findIndex(s => s === null);
  if (emptyW1 !== -1) {
    slots.w1[emptyW1] = letter;
    playTone(440, 'sine', 0.1);
    renderR2Tab(r2ActiveTab);
    return;
  }

  const emptyW2 = slots.w2.findIndex(s => s === null);
  if (emptyW2 !== -1) {
    slots.w2[emptyW2] = letter;
    playTone(493.88, 'sine', 0.1);
    renderR2Tab(r2ActiveTab);
  }
}

export function removeR2Letter(wordKey, slotIdx) {
  const slots = r2UserSlots[r2ActiveTab];
  if (slots[wordKey][slotIdx]) {
    slots[wordKey][slotIdx] = null;
    playTone(330, 'triangle', 0.08);
    renderR2Tab(r2ActiveTab);
  }
}

export function resetCurrentTabR2() {
  const pair = R2_PAIRS[r2ActiveTab];
  r2UserSlots[r2ActiveTab].w1 = pair.w1.letters.map(() => null);
  r2UserSlots[r2ActiveTab].w2 = pair.w2.letters.map(() => null);
  renderR2Tab(r2ActiveTab);
}

export function checkCurrentTabR2() {
  const pair = R2_PAIRS[r2ActiveTab];
  const slots = r2UserSlots[r2ActiveTab];
  const feedback = document.getElementById('r2-feedback');

  const correctW1 = pair.w1.letters.join('');
  const userW1 = slots.w1.join('');

  const correctW2 = pair.w2.letters.join('');
  const userW2 = slots.w2.join('');

  if (userW1 === correctW1 && userW2 === correctW2) {
    r2TabCompleted[r2ActiveTab] = true;
    playSuccessFanfare();
    showItemToast('🎉', `Tahniah! Ejaan ${pair.title} tepat!`);
    speakBM(`Tahniah! Ejaan ${pair.title} tepat dan betul.`);

    // Update tab button with checkmark
    const tabBtns = document.querySelectorAll('.r2-tab-btn');
    if (tabBtns[r2ActiveTab]) {
      tabBtns[r2ActiveTab].style.borderColor = '#10B981';
      tabBtns[r2ActiveTab].innerHTML = `✅ ${pair.title}`;
    }

    if (feedback) {
      feedback.className = 'feedback-banner success';
      feedback.textContent = `✅ Syabas! Ejaan perkataan Jawi "${pair.w1.jawi}" dan "${pair.w2.jawi}" adalah tepat!`;
      feedback.style.display = 'block';
    }

    // Check if all 4 tabs completed
    if (r2TabCompleted.every(Boolean)) {
      gameState.room2Completed = true;
      const proceedBtn = document.getElementById('btn-proceed-r3');
      if (proceedBtn) proceedBtn.style.display = 'block';
      showItemToast('🏆', 'Semua 4 Pasangan Kata Berjaya Dieja!');
      speakBM('Syabas! Anda telah berjaya mengeja semua 4 pasangan perkataan Jawi dengan cemerlang.');
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
// 11. ROOM 4 MODAL: STUDIO PERSEMBAHAN SENI TULISAN JAWI (40 Marks • SP 4.4.2)
// ==========================================
let khatCanvas = null;
let khatCtx = null;
let isDrawing = false;
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

export function openRoom4Modal() {
  openModal('room4-modal');
  initKhatCanvas();
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
  currentStroke = { color: khatInkColor, size: khatBrushSize, points: [pos] };
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
}

export function setKhatInk(color, btnEl) {
  khatInkColor = color;
  document.querySelectorAll('.khat-color-dot').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
}

export function selectKhatIdiom(idiomId) {
  khatSelectedIdiom = idiomId;
  document.querySelectorAll('.khat-idiom-choice').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
  userStrokes = []; // Clear canvas for new idiom
  redrawKhatCanvas();
}

export function toggleTracingGuide() {
  khatShowGuide = !khatShowGuide;
  const textEl = document.getElementById('guide-btn-text');
  if (textEl) textEl.textContent = khatShowGuide ? 'Sembunyi Surihan' : 'Tunjuk Surihan';
  redrawKhatCanvas();
}

export function clearKhatDrawing() {
  userStrokes = [];
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

  // 4. Draw User Calligraphy Strokes
  userStrokes.forEach(stroke => {
    if (stroke.isStencil) {
      khatCtx.save();
      khatCtx.font = 'bold 124px "Amiri", serif';
      khatCtx.textAlign = 'center';
      khatCtx.textBaseline = 'middle';
      khatCtx.fillStyle = stroke.color;
      khatCtx.shadowColor = 'rgba(0,0,0,0.2)';
      khatCtx.shadowBlur = 8;
      khatCtx.fillText(stroke.jawi, w / 2, h / 2 - 10);
      khatCtx.restore();
    } else if (stroke.points && stroke.points.length > 1) {
      khatCtx.save();
      khatCtx.strokeStyle = stroke.color;
      khatCtx.lineWidth = stroke.size;
      khatCtx.lineCap = 'round';
      khatCtx.lineJoin = 'round';
      khatCtx.beginPath();
      khatCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        khatCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      khatCtx.stroke();
      khatCtx.restore();
    }
  });

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
  playSuccessFanfare();

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
      rubricEl.innerHTML = `<strong>Tahap Penguasaan 6 (Cemerlang):</strong> Murid berupaya menulis simpulan bahasa dalam Jawi dengan ejaan tepat dan mempersembahkan keindahan seni tulisan Jawi menggunakan corak dan bingkai yang sangat kreatif mengikut Standard Pembelajaran 4.4.2.`;
    } else if (totalScore >= 70) {
      badgeEl.classList.add('tp5');
      badgeEl.textContent = 'Tahap Penguasaan 5 (Sangat Baik)';
      rubricEl.innerHTML = `<strong>Tahap Penguasaan 5 (Sangat Baik):</strong> Murid berupaya mengeja perkataan Jawi, mencantum simpulan bahasa, dan mempersembahkan seni khat dengan kemas dan teratur mengikut Standard Pembelajaran 4.4.2.`;
    } else if (totalScore >= 50) {
      badgeEl.classList.add('tp4');
      badgeEl.textContent = 'Tahap Penguasaan 4 (Baik)';
      rubricEl.innerHTML = `<strong>Tahap Penguasaan 4 (Baik):</strong> Murid menguasai asas ejaan dan cantuman simpulan bahasa serta melukis kaligrafi dengan bimbingan minimum mengikut Standard Pembelajaran 4.4.2.`;
    } else {
      badgeEl.classList.add('tp3');
      badgeEl.textContent = 'Tahap Penguasaan 3 (Memuaskan)';
      rubricEl.innerHTML = `<strong>Tahap Penguasaan 3 (Memuaskan):</strong> Murid berupaya mengeja dan mempersembahkan seni Jawi pada tahap memuaskan mengikut Standard Pembelajaran 4.4.2.`;
    }
  }

  openModal('report-modal');
}

export function restartGame() {
  location.reload();
}

// ==========================================
// 13. GLOBAL BINDINGS FOR HTML ONCLICK COMPATIBILITY
// ==========================================
if (typeof window !== 'undefined') {
  window.openProfileModal = openProfileModal;
  window.saveProfile = saveProfile;
  window.toggleVoiceover = toggleVoiceover;
  window.handleCurrentInteraction = handleCurrentInteraction;
  window.closeModal = closeModal;
  window.handleOverlayClick = handleOverlayClick;

  // Room 1
  window.openRoom1Modal = openRoom1Modal;
  window.quickCollectR1 = quickCollectR1;
  window.proceedToRoom2 = proceedToRoom2;

  // Room 2
  window.openRoom2Modal = openRoom2Modal;
  window.switchR2Tab = switchR2Tab;
  window.addR2Letter = addR2Letter;
  window.removeR2Letter = removeR2Letter;
  window.resetCurrentTabR2 = resetCurrentTabR2;
  window.checkCurrentTabR2 = checkCurrentTabR2;
  window.proceedToRoom3 = proceedToRoom3;

  // Room 3
  window.openRoom3Modal = openRoom3Modal;
  window.resetMatchingR3 = resetMatchingR3;
  window.checkMatchingR3 = checkMatchingR3;
  window.proceedToRoom4 = proceedToRoom4;

  // Room 4
  window.openRoom4Modal = openRoom4Modal;
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

  // Final PBD Report
  window.showFinalPBDReport = showFinalPBDReport;
  window.restartGame = restartGame;
}

// Touch event bindings for D-Pad
function initTouchControls() {
  const dpadUp = document.getElementById('dpad-up');
  const dpadDown = document.getElementById('dpad-down');
  const dpadLeft = document.getElementById('dpad-left');
  const dpadRight = document.getElementById('dpad-right');

  const bindDpad = (btn, keyProp) => {
    if (!btn) return;
    const press = (e) => {
      e.preventDefault();
      keys[keyProp] = true;
      btn.classList.add('active');
    };
    const release = (e) => {
      e.preventDefault();
      keys[keyProp] = false;
      btn.classList.remove('active');
    };
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
  };

  bindDpad(dpadUp, 'w');
  bindDpad(dpadDown, 's');
  bindDpad(dpadLeft, 'a');
  bindDpad(dpadRight, 'd');

  window.addEventListener('blur', () => {
    keys.w = false; keys.s = false; keys.a = false; keys.d = false;
    keys.ArrowUp = false; keys.ArrowDown = false; keys.ArrowLeft = false; keys.ArrowRight = false;
    document.querySelectorAll('.dpad-btn').forEach(b => b.classList.remove('active'));
  });
}

initTouchControls();
