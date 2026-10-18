// ==========================================
// UI.JS - DOM Manipulations, Audio, Trialogical Modals & PBD Report
// ==========================================
import {
  ROOM_CONFIG,
  studentProfile,
  gameScores,
  gameState,
  PUZZLE_R1_CORRECT,
  PUZZLE_R2_CORRECT,
  COLLECTIBLES_R1,
  COLLECTIBLES_R2,
  COLLECTIBLES_R3,
  keys
} from './state.js?v=4.4.2';

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
  toRoom3: null
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
  playTone(523.25, 'triangle', 0.15, 0);       // C5
  playTone(659.25, 'triangle', 0.18, 0.08);    // E5
  playTone(783.99, 'sine', 0.3, 0.16);         // G5
}

export function playTeleportSfx() {
  playTone(440, 'sine', 0.2, 0);
  playTone(554.37, 'sine', 0.2, 0.08);
  playTone(659.25, 'triangle', 0.25, 0.16);
  playTone(880, 'sine', 0.4, 0.24);
}

export function playSuccessFanfare() {
  playTone(523.25, 'triangle', 0.2, 0);
  playTone(659.25, 'triangle', 0.2, 0.12);
  playTone(783.99, 'triangle', 0.2, 0.24);
  playTone(1046.50, 'sine', 0.5, 0.36);
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
// 3. DYNAMIC INVENTORY HUD
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
    if (invTitleTextEl) invTitleTextEl.textContent = 'Koleksi Huruf Jawi';
    if (invCountEl) invCountEl.textContent = `${collected} / 4`;

    COLLECTIBLES_R1.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `slot-item jawi-char slot-${item.id} ${item.collected ? 'unlocked' : ''}`;
      slot.id = `inv-${item.id}`;
      slot.title = `Huruf ${item.name} (${item.char})`;
      slot.innerHTML = `
        <span class="slot-char">${item.collected ? item.char : '?'}</span>
        <span class="slot-label">${item.name}</span>
      `;
      invSlotsContainer.appendChild(slot);
    });
    return;
  }

  if (room === 'room2') {
    const collected = COLLECTIBLES_R2.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Kad Simpulan Bahasa Jawi';
    if (invCountEl) invCountEl.textContent = `${collected} / 2`;

    COLLECTIBLES_R2.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `slot-item jawi-char ${item.collected ? 'unlocked' : ''}`;
      slot.id = `inv-${item.id}`;
      slot.title = `Kad Jawi: ${item.name} (${item.char})`;
      slot.innerHTML = `
        <span class="slot-char">${item.collected ? item.char : '?'}</span>
        <span class="slot-label">${item.name}</span>
      `;
      invSlotsContainer.appendChild(slot);
    });
    return;
  }

  if (room === 'room3') {
    const collected = COLLECTIBLES_R3.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Alatan Seni Khat';
    if (invCountEl) invCountEl.textContent = `${collected} / 3`;

    COLLECTIBLES_R3.forEach(item => {
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
    showItemToast(item.char, `Hebat! Anda menemui huruf: ${item.name} (${item.char})`);
    speakBM(`Huruf Jawi: ${item.name}. Padanan Rumi: ${item.rumi}`);
    const count = COLLECTIBLES_R1.filter(c => c.collected).length;
    if (count === 4) {
      updateMissionText('Tahniah! Semua 4 huruf ditemui. Pergi ke Meja Guru untuk menyusun huruf Jawi!');
    } else {
      updateMissionText(`Misi: Cari ${4 - count} lagi kristal Jawi di bilik darjah.`);
    }
  } else if (currentRoom === 'room2') {
    showItemToast(item.char, `Tahniah! Anda menjumpai kad Jawi: ${item.name} (${item.char})`);
    speakBM(`Kad perkataan Jawi: ${item.name}. ${item.char}`);
    const count = COLLECTIBLES_R2.filter(c => c.collected).length;
    if (count === 2) {
      updateMissionText('Tahniah! Kedua-dua kad Jawi ditemui. Pergi ke Meja Bacaan untuk membina simpulan bahasa Jawi!');
    } else {
      updateMissionText(`Misi: Cari 1 lagi kad Jawi di Pusat Sumber.`);
    }
  } else if (currentRoom === 'room3') {
    showItemToast(item.char, `${item.name}: ${item.desc}`, 4500);
    speakBM(`Alatan seni khat ditemui: ${item.name}. ${item.desc}`);
    const count = COLLECTIBLES_R3.filter(c => c.collected).length;
    if (count === 3) {
      updateMissionText('Tahniah! Semua alatan seni khat ditemui. Pergi ke Kanvas Pameran Utama untuk menghasilkan karya seni Jawi!');
    } else {
      updateMissionText(`Misi: Cari ${3 - count} lagi alatan seni khat di studio seni.`);
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
    showItemToast('👩‍🏫', `Cikgu Aminah: "Selamat datang, ${studentProfile.name}! Sedia meneroka bahasa di Sekolah Bestari?"`);
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
      showItemToast('⚠️', 'Sila selesaikan susunan huruf di Meja Guru terlebih dahulu!');
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
      showItemToast('⚠️', 'Sila selesaikan susunan simpulan bahasa Jawi di Meja Bacaan terlebih dahulu!');
      return;
    }
    if (teleportCallbacks.toRoom3) {
      teleportCallbacks.toRoom3();
      updateInventoryHUD();
    }
    return;
  }

  if (target === 'returnLobby') {
    if (teleportCallbacks.toLobby) {
      teleportCallbacks.toLobby();
      updateInventoryHUD();
    }
    return;
  }

  if (target === 'tableR1') {
    openRoom1Modal();
    return;
  }

  if (target === 'tableR2') {
    const countR2 = COLLECTIBLES_R2.filter(c => c.collected).length;
    if (countR2 < 2) {
      playErrorBuzzer();
      showItemToast('📖', `Kumpulkan kedua-dua kad Jawi di Pusat Sumber dahulu! (${countR2} / 2)`);
      return;
    }
    openRoom2Modal();
    return;
  }

  if (target === 'tableR3') {
    const countR3 = COLLECTIBLES_R3.filter(c => c.collected).length;
    if (countR3 < 3) {
      playErrorBuzzer();
      showItemToast('🎨', `Kumpulkan kesemua 3 alatan seni di studio seni dahulu! (${countR3} / 3)`);
      return;
    }
    openRoom3Modal();
  }
}

// ==========================================
// 8. ROOM 1 PUZZLE: CANTUMAN JAWI 'GUNA' (40 Marks)
// ==========================================
export function openRoom1Modal() {
  setupR1Tray();
  renderR1DropZones();
  updateR1PreviewWord();
  updateR1ScoreDisplay();

  const puzzleView = document.getElementById('r1-puzzle-view');
  const successView = document.getElementById('r1-success-view');
  const feedback = document.getElementById('r1-feedback');

  if (puzzleView) puzzleView.style.display = gameState.room1Completed ? 'none' : 'block';
  if (successView) successView.style.display = gameState.room1Completed ? 'block' : 'none';
  if (feedback) feedback.style.display = 'none';

  openModal('room1-modal');
}

export function updateR1ScoreDisplay() {
  const scoreEl = document.getElementById('r1-live-score');
  const attemptsEl = document.getElementById('r1-attempts');
  if (scoreEl) scoreEl.textContent = `${gameScores.room1} / 40`;
  if (attemptsEl) attemptsEl.textContent = gameScores.attemptsR1;
}

export function setupR1Tray() {
  const trayEl = document.getElementById('r1-letters-tray');
  if (!trayEl) return;
  trayEl.innerHTML = '';

  const collectedLetters = COLLECTIBLES_R1.filter(c => c.collected);
  if (collectedLetters.length === 0) {
    trayEl.innerHTML = '<div style="color: #64748B; font-size: 12px; padding: 10px;">Peti anda kosong. Terokai bilik darjah untuk mencari huruf dahulu!</div>';
    return;
  }

  collectedLetters.forEach(item => {
    if (!gameState.puzzleR1Placed.includes(item.id)) {
      const tile = createR1LetterTile(item);
      trayEl.appendChild(tile);
    }
  });
}

export function createR1LetterTile(item) {
  const tile = document.createElement('div');
  tile.className = `letter-tile tile-${item.id}`;
  tile.draggable = true;
  tile.id = `tile-${item.id}`;
  tile.dataset.itemId = item.id;

  tile.innerHTML = `
    <span class="tile-jawi">${item.char}</span>
    <span class="tile-rumi">${item.name}</span>
  `;

  tile.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', item.id);
  });

  tile.addEventListener('click', () => {
    const firstEmpty = gameState.puzzleR1Placed.findIndex(s => s === null);
    if (firstEmpty !== -1) {
      placeR1ItemInSlot(item.id, firstEmpty);
    }
  });

  return tile;
}

export function renderR1DropZones() {
  const zones = document.querySelectorAll('#room1-modal .drop-zone');
  zones.forEach((zone, index) => {
    const itemId = gameState.puzzleR1Placed[index];
    zone.innerHTML = `<span class="zone-idx">${index === 0 ? '1 (Kanan)' : index === 3 ? '4 (Kiri)' : index + 1}</span>`;

    if (itemId) {
      const item = COLLECTIBLES_R1.find(c => c.id === itemId);
      zone.classList.add('filled');
      if (item) {
        const tile = createR1LetterTile(item);
        zone.appendChild(tile);
      }
    } else {
      zone.classList.remove('filled');
    }
  });
}

export function placeR1ItemInSlot(itemId, targetSlot) {
  const existingIdx = gameState.puzzleR1Placed.indexOf(itemId);
  if (existingIdx !== -1) {
    gameState.puzzleR1Placed[existingIdx] = null;
  }
  gameState.puzzleR1Placed[targetSlot] = itemId;

  renderR1DropZones();
  setupR1Tray();
  updateR1PreviewWord();
}

export function handleZoneClickR1(slotIndex) {
  const itemId = gameState.puzzleR1Placed[slotIndex];
  if (itemId) {
    gameState.puzzleR1Placed[slotIndex] = null;
    renderR1DropZones();
    setupR1Tray();
    updateR1PreviewWord();
  }
}

export function handleDropR1(event, slotIndex) {
  event.preventDefault();
  if (event.currentTarget) event.currentTarget.classList.remove('drag-over');
  const itemId = event.dataTransfer.getData('text/plain');
  if (itemId) {
    placeR1ItemInSlot(itemId, slotIndex);
  }
}

export function handleDropToTrayR1(event) {
  event.preventDefault();
  const itemId = event.dataTransfer.getData('text/plain');
  if (itemId) {
    const idx = gameState.puzzleR1Placed.indexOf(itemId);
    if (idx !== -1) {
      gameState.puzzleR1Placed[idx] = null;
      renderR1DropZones();
      setupR1Tray();
      updateR1PreviewWord();
    }
  }
}

export function resetPuzzleR1() {
  gameState.puzzleR1Placed = [null, null, null, null];
  renderR1DropZones();
  setupR1Tray();
  updateR1PreviewWord();
  const feedback = document.getElementById('r1-feedback');
  if (feedback) feedback.style.display = 'none';
}

export function updateR1PreviewWord() {
  const previewEl = document.getElementById('r1-assembled-preview');
  if (!previewEl) return;

  const chars = gameState.puzzleR1Placed.map(id => {
    if (!id) return 'ـ';
    const item = COLLECTIBLES_R1.find(c => c.id === id);
    return item ? item.char : 'ـ';
  });
  previewEl.textContent = chars.join(' ');
}

export function checkPuzzleR1() {
  const feedbackEl = document.getElementById('r1-feedback');

  if (gameState.puzzleR1Placed.some(s => s === null)) {
    playErrorBuzzer();
    if (feedbackEl) {
      feedbackEl.className = 'feedback-banner error';
      feedbackEl.innerHTML = '⚠️ Sila isikan kesemua 4 petak huruf Jawi sebelum menyemak!';
      feedbackEl.style.display = 'block';
    }
    return;
  }

  const isCorrect = gameState.puzzleR1Placed.every((id, idx) => id === PUZZLE_R1_CORRECT[idx]);

  if (isCorrect) {
    gameState.room1Completed = true;
    playSuccessFanfare();
    speakBM('Tahniah! Cantuman huruf Jawi guna berjaya dibina dengan tepat. Portal ke Bilik 2 kini dibuka.');

    const puzzleView = document.getElementById('r1-puzzle-view');
    const successView = document.getElementById('r1-success-view');
    const successScoreEl = document.getElementById('r1-success-score');

    if (puzzleView) puzzleView.style.display = 'none';
    if (successView) successView.style.display = 'block';
    if (successScoreEl) successScoreEl.textContent = `${gameScores.room1} / 40`;

    showItemToast('🌟', 'Tahniah! Ejaan Jawi "GUNA" tepat! Portal ke Bilik 2 dibuka.');
  } else {
    gameScores.attemptsR1 += 1;
    // Deduct 5 marks per wrong check attempt (minimum 10 marks)
    gameScores.room1 = Math.max(10, 40 - (gameScores.attemptsR1 * 5));
    updateR1ScoreDisplay();
    playErrorBuzzer();
    speakBM('Susunan huruf Jawi belum tepat. Ejaan guna bermula dari huruf Ga di sebelah kanan. Sila cuba lagi.');

    if (feedbackEl) {
      feedbackEl.className = 'feedback-banner error';
      feedbackEl.innerHTML = `
        <strong>Cuba Lagi!</strong> Ejaan bagi perkataan "GUNA" bermula dengan huruf <strong>Ga (ݢ)</strong> di petak kanan sekali, diikuti <strong>Wau (و)</strong>, <strong>Nun (ن)</strong>, dan berakhir dengan <strong>Alif (ا)</strong> di petak kiri. (-5 Markah Penalti)
      `;
      feedbackEl.style.display = 'block';
    }
  }
}

export function proceedToRoom2() {
  closeModal('room1-modal');
  if (teleportCallbacks.toRoom2) {
    teleportCallbacks.toRoom2();
    updateInventoryHUD();
  }
}

// ==========================================
// 9. ROOM 2 PUZZLE: MEMBINA SIMPULAN BAHASA JAWI (30 Marks)
// ==========================================
export function openRoom2Modal() {
  setupR2Tray();
  renderR2DropZones();
  updateR2Preview();
  updateR2ScoreDisplay();

  const puzzleView = document.getElementById('r2-puzzle-view');
  const successView = document.getElementById('r2-success-view');
  const feedback = document.getElementById('r2-feedback');

  if (puzzleView) puzzleView.style.display = gameState.room2Completed ? 'none' : 'block';
  if (successView) successView.style.display = gameState.room2Completed ? 'block' : 'none';
  if (feedback) feedback.style.display = 'none';

  openModal('room2-modal');
}

export function updateR2ScoreDisplay() {
  const scoreEl = document.getElementById('r2-live-score');
  const attemptsEl = document.getElementById('r2-attempts');
  if (scoreEl) scoreEl.textContent = `${gameScores.room2} / 30`;
  if (attemptsEl) attemptsEl.textContent = gameScores.attemptsR2;
}

export function setupR2Tray() {
  const trayEl = document.getElementById('r2-frags-tray');
  if (!trayEl) return;
  trayEl.innerHTML = '';

  const collectedFrags = COLLECTIBLES_R2.filter(c => c.collected);
  if (collectedFrags.length === 0) {
    trayEl.innerHTML = '<div style="color: #64748B; font-size: 12px; padding: 10px;">Peti anda kosong. Terokai Pusat Sumber untuk mencari kad Jawi dahulu!</div>';
    return;
  }

  collectedFrags.forEach(item => {
    if (!gameState.puzzleR2Placed.includes(item.id)) {
      const tile = createR2FragTile(item);
      trayEl.appendChild(tile);
    }
  });
}

export function createR2FragTile(item) {
  const tile = document.createElement('div');
  tile.className = 'jawi-idiom-tile';
  tile.draggable = true;
  tile.id = `frag-${item.id}`;
  tile.dataset.itemId = item.id;
  tile.innerHTML = `
    <span class="tile-jawi">${item.char}</span>
    <span class="tile-rumi">${item.name} (${item.role})</span>
  `;

  tile.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', item.id);
  });

  tile.addEventListener('click', () => {
    const firstEmpty = gameState.puzzleR2Placed.findIndex(s => s === null);
    if (firstEmpty !== -1) {
      placeR2ItemInSlot(item.id, firstEmpty);
    }
  });

  return tile;
}

export function renderR2DropZones() {
  const zones = document.querySelectorAll('#room2-modal .jawi-idiom-zone');
  const labels = ['1. Perkataan Pertama (Kanan)', '2. Perkataan Kedua (Kiri)'];

  zones.forEach((zone, index) => {
    const itemId = gameState.puzzleR2Placed[index];
    const defaultLabel = labels[index];

    if (itemId) {
      const item = COLLECTIBLES_R2.find(c => c.id === itemId);
      zone.classList.add('filled');
      zone.innerHTML = `
        <span class="zone-idx">${defaultLabel}</span>
        <div class="jawi-idiom-tile" style="margin: 4px 0; border-color: #10B981; cursor: pointer;" onclick="handleZoneClickR2(${index})" title="Klik untuk pulangkan ke dulang">
          <span class="tile-jawi">${item ? item.char : ''}</span>
          <span class="tile-rumi">${item ? item.name : ''}</span>
        </div>
      `;
    } else {
      zone.classList.remove('filled');
      zone.innerHTML = `
        <span class="zone-idx">${defaultLabel}</span>
        <span class="zone-placeholder" style="font-size: 11px; color: #94A3B8;">[Letak kad Jawi di sini]</span>
      `;
    }
  });
}

export function placeR2ItemInSlot(itemId, targetSlot) {
  const existingIdx = gameState.puzzleR2Placed.indexOf(itemId);
  if (existingIdx !== -1) {
    gameState.puzzleR2Placed[existingIdx] = null;
  }
  gameState.puzzleR2Placed[targetSlot] = itemId;

  renderR2DropZones();
  setupR2Tray();
  updateR2Preview();
}

export function handleZoneClickR2(slotIndex) {
  const itemId = gameState.puzzleR2Placed[slotIndex];
  if (itemId) {
    gameState.puzzleR2Placed[slotIndex] = null;
    renderR2DropZones();
    setupR2Tray();
    updateR2Preview();
  }
}

export function handleDropR2(event, slotIndex) {
  event.preventDefault();
  if (event.currentTarget) event.currentTarget.classList.remove('drag-over');
  const itemId = event.dataTransfer.getData('text/plain');
  if (itemId) {
    placeR2ItemInSlot(itemId, slotIndex);
  }
}

export function handleDropToTrayR2(event) {
  event.preventDefault();
  const itemId = event.dataTransfer.getData('text/plain');
  if (itemId) {
    const idx = gameState.puzzleR2Placed.indexOf(itemId);
    if (idx !== -1) {
      gameState.puzzleR2Placed[idx] = null;
      renderR2DropZones();
      setupR2Tray();
      updateR2Preview();
    }
  }
}

export function resetPuzzleR2() {
  gameState.puzzleR2Placed = [null, null];
  renderR2DropZones();
  setupR2Tray();
  updateR2Preview();
  const feedback = document.getElementById('r2-feedback');
  if (feedback) feedback.style.display = 'none';
}

export function updateR2Preview() {
  const previewEl = document.getElementById('r2-sentence-preview');
  if (!previewEl) return;

  const parts = gameState.puzzleR2Placed.map(id => {
    if (!id) return 'ـ';
    const item = COLLECTIBLES_R2.find(c => c.id === id);
    return item ? item.char : 'ـ';
  });
  // Right-to-Left: Slot 0 (Kanan) first, followed by Slot 1 (Kiri)
  previewEl.textContent = parts.join(' ');
}

export function checkPuzzleR2() {
  const feedbackEl = document.getElementById('r2-feedback');

  if (gameState.puzzleR2Placed.some(s => s === null)) {
    playErrorBuzzer();
    if (feedbackEl) {
      feedbackEl.className = 'feedback-banner error';
      feedbackEl.innerHTML = '⚠️ Sila isikan kedua-dua petak simpulan bahasa Jawi sebelum menyemak!';
      feedbackEl.style.display = 'block';
    }
    return;
  }

  const isCorrect = (
    gameState.puzzleR2Placed[0] === PUZZLE_R2_CORRECT[0] &&
    gameState.puzzleR2Placed[1] === PUZZLE_R2_CORRECT[1]
  );

  if (isCorrect) {
    gameState.room2Completed = true;
    playSuccessFanfare();
    speakBM('Tahniah! Simpulan bahasa Jawi Ulat Buku berjaya dibina dengan ejaan yang tepat. Portal ke Bilik 3 kini dibuka.');

    const puzzleView = document.getElementById('r2-puzzle-view');
    const successView = document.getElementById('r2-success-view');
    const successScoreEl = document.getElementById('r2-success-score');

    if (puzzleView) puzzleView.style.display = 'none';
    if (successView) successView.style.display = 'block';
    if (successScoreEl) successScoreEl.textContent = `${gameScores.room2} / 30`;

    showItemToast('🌟', 'Tahniah! Simpulan bahasa Jawi "اولت بوکو" tepat!');
  } else {
    gameScores.attemptsR2 += 1;
    // Deduct 5 marks per wrong attempt (minimum 10 marks)
    gameScores.room2 = Math.max(10, 30 - (gameScores.attemptsR2 * 5));
    updateR2ScoreDisplay();
    playErrorBuzzer();
    speakBM('Susunan simpulan bahasa Jawi belum tepat. Ejaan Ulat Buku bermula dengan perkataan Ulat di petak kanan. Sila cuba lagi.');

    if (feedbackEl) {
      feedbackEl.className = 'feedback-banner error';
      feedbackEl.innerHTML = `
        <strong>Susunan Belum Tepat!</strong> Dalam tulisan Jawi (kanan ke kiri), simpulan bahasa "ULAT BUKU" bermula dengan perkataan <strong>اولت (Ulat)</strong> di petak kanan, dan diikuti oleh <strong>بوکو (Buku)</strong> di petak kiri. (-5 Markah Penalti)
      `;
      feedbackEl.style.display = 'block';
    }
  }
}

export function proceedToRoom3() {
  closeModal('room2-modal');
  if (teleportCallbacks.toRoom3) {
    teleportCallbacks.toRoom3();
    updateInventoryHUD();
  }
}

// ==========================================
// 10. ROOM 3: STUDIO SENI KHAT JAWI (30 Marks • DSKP 4.4.2)
// ==========================================
export function updateR3ScoreDisplay() {
  const scoreEl = document.getElementById('r3-live-score');
  if (scoreEl) scoreEl.textContent = `${gameScores.room3} / 30`;
}

export function openRoom3Modal() {
  updateR3ScoreDisplay();
  updateArtboardDOM();
  const feedback = document.getElementById('r3-feedback');
  if (feedback) feedback.style.display = 'none';
  openModal('room3-modal');
}

export function updateArtboardDOM() {
  const card = document.getElementById('artboard-card');
  if (!card) return;

  const { bg, textColor, frame } = gameState.artworkR3;
  card.className = `artboard-card bg-${bg} text-${textColor} frame-${frame}`;

  // Update button active indicators
  ['batik', 'songket', 'vellum'].forEach(b => {
    const btn = document.getElementById(`btn-bg-${b}`);
    if (btn) btn.classList.toggle('active', bg === b);
  });

  ['gold', 'black', 'indigo'].forEach(c => {
    const btn = document.getElementById(`btn-text-${c}`);
    if (btn) btn.classList.toggle('active', textColor === c);
  });

  ['wood', 'gold', 'minimal'].forEach(f => {
    const btn = document.getElementById(`btn-frame-${f}`);
    if (btn) btn.classList.toggle('active', frame === f);
  });
}

export function setArtworkBg(bgType) {
  gameState.artworkR3.bg = bgType;
  updateArtboardDOM();
  playTone(523.25, 'triangle', 0.12);
  const labels = { batik: 'Corak Batik Emas', songket: 'Corak Songket Diraja', vellum: 'Kertas Vellum' };
  showItemToast('🖼️', `Latar Belakang: ${labels[bgType] || bgType}`);
}

export function setArtworkTextColor(colorType) {
  gameState.artworkR3.textColor = colorType;
  updateArtboardDOM();
  playTone(659.25, 'triangle', 0.12);
  const labels = { gold: 'Emas Berkilau', black: 'Hitam Klasik', indigo: 'Biru Nila' };
  showItemToast('🖌️', `Warna Tulisan Khat: ${labels[colorType] || colorType}`);
}

export function setArtworkFrame(frameType) {
  gameState.artworkR3.frame = frameType;
  updateArtboardDOM();
  playTone(783.99, 'sine', 0.15);
  const labels = { wood: 'Bingkai Ukiran Kayu', gold: 'Bingkai Emas', minimal: 'Bingkai Minimalis' };
  showItemToast('🖼️', `Bingkai Seni: ${labels[frameType] || frameType}`);
}

export function submitArtworkR3() {
  gameState.room3Completed = true;
  gameScores.room3 = 30;
  playSuccessFanfare();
  speakBM(`Tahniah ${studentProfile.name}! Anda berjaya mempersembahkan keindahan seni tulisan Jawi simpulan bahasa Ulat Buku dengan sangat kreatif.`);

  closeModal('room3-modal');
  showFinalPBDReport();
}

// ==========================================
// 11. FINAL PBD REPORT CARD (Kad Laporan PBD)
// ==========================================
export function showFinalPBDReport() {
  const totalScore = gameScores.total();

  // Dynamic TP calculation
  let tpLevel = 'TP 3';
  let tpClass = 'tp3';
  let rubricText = '';

  if (totalScore >= 90) {
    tpLevel = 'TP 6';
    tpClass = 'tp6';
    rubricText = 'Tahap Penguasaan 6 (Cemerlang / Berdikari): Murid berjaya menulis simpulan bahasa dalam Jawi dengan ejaan tepat dan mempersembahkan keindahan seni tulisan Jawi menggunakan corak dan bingkai yang sangat kreatif mengikut Standard Pembelajaran 4.4.2.';
  } else if (totalScore >= 75) {
    tpLevel = 'TP 5';
    tpClass = 'tp5';
    rubricText = 'Tahap Penguasaan 5 (Sangat Baik / Terpuji): Murid berupaya menyusun huruf Jawi menjadi perkataan bermakna, mencantumkan keratan simpulan bahasa Jawi dengan tepat, serta mempersembahkan seni khat Jawi dengan gubahan artistik yang menarik.';
  } else if (totalScore >= 60) {
    tpLevel = 'TP 4';
    tpClass = 'tp4';
    rubricText = 'Tahap Penguasaan 4 (Memuaskan / Baik): Murid berupaya melengkapkan tugasan pembelajaran di bilik darjah bestari, perpustakaan, dan studio seni khat dengan menunjukkan kefahaman yang memuaskan terhadap tulisan Jawi dan simpulan bahasa.';
  } else {
    tpLevel = 'TP 3';
    tpClass = 'tp3';
    rubricText = 'Tahap Penguasaan 3 (Tahap Asas): Murid berupaya membina artifak digital Jawi pada tahap asas dan digalakkan untuk terus memperkaya latihan seni kaligrafi Jawi.';
  }

  // Populate Report Card DOM
  const nameEl = document.getElementById('report-student-name');
  const classEl = document.getElementById('report-student-class');
  const scoreR1El = document.getElementById('report-score-r1');
  const scoreR2El = document.getElementById('report-score-r2');
  const scoreR3El = document.getElementById('report-score-r3');
  const totalScoreEl = document.getElementById('report-score-total');
  const tpBadgeEl = document.getElementById('report-tp-badge');
  const rubricEl = document.getElementById('report-rubric-desc');

  if (nameEl) nameEl.textContent = studentProfile.name;
  if (classEl) classEl.textContent = studentProfile.class;
  if (scoreR1El) scoreR1El.textContent = `${gameScores.room1} / 40 (Cubaan salah: ${gameScores.attemptsR1})`;
  if (scoreR2El) scoreR2El.textContent = `${gameScores.room2} / 30 (Cubaan salah: ${gameScores.attemptsR2})`;
  if (scoreR3El) scoreR3El.textContent = `${gameScores.room3} / 30`;
  if (totalScoreEl) totalScoreEl.textContent = `${totalScore} / 100`;

  if (tpBadgeEl) {
    tpBadgeEl.textContent = tpLevel;
    tpBadgeEl.className = `tp-badge-large ${tpClass}`;
  }

  if (rubricEl) {
    rubricEl.textContent = rubricText;
  }

  // Update Visual Miniature Replica of Customized Artwork in Report
  const reportDisplay = document.getElementById('report-artwork-display');
  if (reportDisplay) {
    const { bg, textColor, frame } = gameState.artworkR3;
    reportDisplay.className = `report-artwork-replica bg-${bg} text-${textColor} frame-${frame}`;
  }

  openModal('report-modal');

  speakBM(`Tahniah ${studentProfile.name}! Anda berjaya menamatkan kembara bahasa dengan markah keseluruhan ${totalScore} peratus dan mencapai ${tpLevel}.`);
}

// ==========================================
// 12. RESTART GAME
// ==========================================
export function restartGame() {
  if (teleportCallbacks.toLobby) {
    teleportCallbacks.toLobby();
  }

  // Reset Scores & Flags
  gameScores.room1 = 40;
  gameScores.room2 = 30;
  gameScores.room3 = 30;
  gameScores.attemptsR1 = 0;
  gameScores.attemptsR2 = 0;
  gameScores.attemptsR3 = 0;

  gameState.room1Completed = false;
  gameState.room2Completed = false;
  gameState.room3Completed = false;
  gameState.puzzleR1Placed = [null, null, null, null];
  gameState.puzzleR2Placed = [null, null];
  gameState.artworkR3 = {
    bg: 'batik',
    textColor: 'gold',
    frame: 'wood'
  };

  // Reset Collectibles
  const resetList = [...COLLECTIBLES_R1, ...COLLECTIBLES_R2, ...COLLECTIBLES_R3];
  resetList.forEach(c => {
    c.collected = false;
    c.isPopping = false;
    c.popScale = 1.0;
    if (c.mesh) {
      c.mesh.visible = true;
      c.mesh.scale.set(1, 1, 1);
    }
  });

  closeModal('report-modal');
  closeModal('room1-modal');
  closeModal('room2-modal');
  closeModal('room3-modal');

  updateInventoryHUD();
  updateMissionText('Misi: Terokai dataran & dekati portal bercahaya untuk ke Bilik 1.');
  showItemToast('🔄', 'Permainan dimulakan semula. Selamat Meneroka!');
}

// ==========================================
// 13. DRAG & DROP UTILITY
// ==========================================
export function allowDrop(event) {
  event.preventDefault();
  if (event.currentTarget && (event.currentTarget.classList.contains('drop-zone') || event.currentTarget.classList.contains('jawi-idiom-zone') || event.currentTarget.classList.contains('letters-tray'))) {
    event.currentTarget.classList.add('drag-over');
  }
}

// ==========================================
// 14. ON-SCREEN D-PAD & TOUCH CONTROLS
// ==========================================
export function initTouchControls() {
  const dpadUp = document.getElementById('dpad-up');
  const dpadDown = document.getElementById('dpad-down');
  const dpadLeft = document.getElementById('dpad-left');
  const dpadRight = document.getElementById('dpad-right');
  const actionBtn = document.getElementById('touch-action-btn');

  function bindDirectionBtn(btn, keyName1, keyName2) {
    if (!btn) return;

    const press = (e) => {
      if (e && e.cancelable) e.preventDefault();
      keys[keyName1] = true;
      if (keyName2) keys[keyName2] = true;
      btn.classList.add('active');
    };

    const release = (e) => {
      if (e && e.cancelable && e.type !== 'mouseleave') e.preventDefault();
      keys[keyName1] = false;
      if (keyName2) keys[keyName2] = false;
      btn.classList.remove('active');
    };

    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);

    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
  }

  bindDirectionBtn(dpadUp, 'w', 'ArrowUp');
  bindDirectionBtn(dpadDown, 's', 'ArrowDown');
  bindDirectionBtn(dpadLeft, 'a', 'ArrowLeft');
  bindDirectionBtn(dpadRight, 'd', 'ArrowRight');

  if (actionBtn) {
    const triggerAction = (e) => {
      if (e && e.cancelable) e.preventDefault();
      actionBtn.classList.add('active');
      handleCurrentInteraction();
      setTimeout(() => actionBtn.classList.remove('active'), 180);
    };

    actionBtn.addEventListener('click', triggerAction);
    actionBtn.addEventListener('touchstart', triggerAction, { passive: false });
  }

  // Clear keys on window blur
  window.addEventListener('blur', () => {
    keys.w = false; keys.s = false; keys.a = false; keys.d = false;
    keys.ArrowUp = false; keys.ArrowDown = false; keys.ArrowLeft = false; keys.ArrowRight = false;
    document.querySelectorAll('.dpad-btn').forEach(b => b.classList.remove('active'));
  });
}

// Auto-initialize touch controls on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTouchControls);
  } else {
    initTouchControls();
  }
}

// Bind methods to window so inline HTML onclick/ondrag handlers continue working seamlessly
window.handleCurrentInteraction = handleCurrentInteraction;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleOverlayClick = handleOverlayClick;
window.openProfileModal = openProfileModal;
window.saveProfile = saveProfile;
window.toggleVoiceover = toggleVoiceover;
window.speakBM = speakBM;

window.resetPuzzleR1 = resetPuzzleR1;
window.checkPuzzleR1 = checkPuzzleR1;
window.proceedToRoom2 = proceedToRoom2;
window.handleZoneClickR1 = handleZoneClickR1;
window.handleDropR1 = handleDropR1;
window.handleDropToTrayR1 = handleDropToTrayR1;

window.resetPuzzleR2 = resetPuzzleR2;
window.checkPuzzleR2 = checkPuzzleR2;
window.proceedToRoom3 = proceedToRoom3;
window.handleZoneClickR2 = handleZoneClickR2;
window.handleDropR2 = handleDropR2;
window.handleDropToTrayR2 = handleDropToTrayR2;

window.setArtworkBg = setArtworkBg;
window.setArtworkTextColor = setArtworkTextColor;
window.setArtworkFrame = setArtworkFrame;
window.submitArtworkR3 = submitArtworkR3;
window.updateR3ScoreDisplay = updateR3ScoreDisplay;

window.showFinalPBDReport = showFinalPBDReport;
window.restartGame = restartGame;
window.allowDrop = allowDrop;
window.initTouchControls = initTouchControls;
