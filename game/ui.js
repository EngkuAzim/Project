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
  QUIZ_R3_CORRECT,
  COLLECTIBLES_R1,
  COLLECTIBLES_R2,
  COLLECTIBLES_R3,
  keys
} from './state.js';

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
    if (invTitleTextEl) invTitleTextEl.textContent = 'Keratan Buku Cerita';
    if (invCountEl) invCountEl.textContent = `${collected} / 3`;

    COLLECTIBLES_R2.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `slot-item ${item.collected ? 'unlocked' : ''}`;
      slot.id = `inv-${item.id}`;
      slot.title = `${item.role}: ${item.text}`;
      slot.innerHTML = `
        <span class="slot-char">${item.collected ? '📖' : '?'}</span>
        <span class="slot-label">${item.id.replace('frag', 'Bahagian ')}</span>
      `;
      invSlotsContainer.appendChild(slot);
    });
    return;
  }

  if (room === 'room3') {
    const collected = COLLECTIBLES_R3.filter(c => c.collected).length;
    if (invTitleTextEl) invTitleTextEl.textContent = 'Senario Sukan & Kantin';
    if (invCountEl) invCountEl.textContent = `${collected} / 3`;

    COLLECTIBLES_R3.forEach(item => {
      const slot = document.createElement('div');
      slot.className = `slot-item ${item.collected ? 'unlocked' : ''}`;
      slot.id = `inv-${item.id}`;
      slot.title = `${item.label}: ${item.topic}`;
      slot.innerHTML = `
        <span class="slot-char">${item.collected ? '⚽' : '?'}</span>
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
    showItemToast('📖', `Tahniah! Anda menjumpai buku: ${item.text}`);
    speakBM(`Keratan frasa: ${item.text}`);
    const count = COLLECTIBLES_R2.filter(c => c.collected).length;
    if (count === 3) {
      updateMissionText('Tahniah! Semua 3 buku ditemui. Pergi ke Meja Bacaan untuk membina ayat!');
    } else {
      updateMissionText(`Misi: Cari ${3 - count} lagi buku frasa di Pusat Sumber.`);
    }
  } else if (currentRoom === 'room3') {
    const proverbNotes = {
      orb1: 'Nota Pintar #1: ULAT BUKU bermaksud orang yang sangat rajin dan gemar membaca buku.',
      orb2: 'Nota Pintar #2: KAKI BANGKU bermaksud orang yang tidak pandai bermain bola sepak.',
      orb3: 'Nota Pintar #3: MANDI PELUH bermaksud bekerja atau bersukan dengan bersungguh-sungguh.'
    };
    const noteText = proverbNotes[item.id] || item.note || `Bagus! Anda meneroka: ${item.label} (${item.topic})`;
    showItemToast('💡', noteText, 4800);
    speakBM(noteText);
    const count = COLLECTIBLES_R3.filter(c => c.collected).length;
    if (count === 3) {
      updateMissionText('Tahniah! Semua 3 senario diteroka. Pergi ke Pentas Cabaran untuk kuiz peribahasa!');
    } else {
      updateMissionText(`Misi: Terokai ${3 - count} lagi senario sukan di padang/kantin.`);
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
      showItemToast('⚠️', 'Sila selesaikan tugasan bina ayat di Meja Bacaan terlebih dahulu!');
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
    if (countR2 < 3) {
      playErrorBuzzer();
      showItemToast('📚', `Kumpulkan kesemua 3 keratan buku di Pusat Sumber dahulu! (${countR2} / 3)`);
      return;
    }
    openRoom2Modal();
    return;
  }

  if (target === 'tableR3') {
    const countR3 = COLLECTIBLES_R3.filter(c => c.collected).length;
    if (countR3 < 3) {
      playErrorBuzzer();
      showItemToast('⚽', `Terokai kesemua 3 senario di padang & kantin dahulu! (${countR3} / 3)`);
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
// 9. ROOM 2 PUZZLE: SINTAKSIS BINA AYAT (30 Marks)
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
    trayEl.innerHTML = '<div style="color: #64748B; font-size: 12px; padding: 10px;">Peti anda kosong. Terokai Pusat Sumber untuk mencari buku dahulu!</div>';
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
  tile.className = 'frag-tile';
  tile.draggable = true;
  tile.id = `frag-${item.id}`;
  tile.dataset.itemId = item.id;
  tile.innerHTML = `<strong>${item.text}</strong> <span style="font-size: 11px; opacity: 0.7;">(${item.role})</span>`;

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
  const zones = document.querySelectorAll('#room2-modal .sentence-slot');
  const labels = ['1. Subjek / Frasa Nama', '2. Kata Kerja', '3. Objek / Keterangan'];

  zones.forEach((zone, index) => {
    const itemId = gameState.puzzleR2Placed[index];
    const defaultLabel = labels[index];

    if (itemId) {
      const item = COLLECTIBLES_R2.find(c => c.id === itemId);
      zone.classList.add('filled');
      zone.innerHTML = `
        <span class="sentence-slot-label">${defaultLabel}:</span>
        <span class="sentence-slot-content">${item ? item.text : ''}</span>
        <button style="border:none; background:transparent; cursor:pointer; font-size:14px; color:#EF4444;" onclick="handleZoneClickR2(${index})">&times;</button>
      `;
    } else {
      zone.classList.remove('filled');
      zone.innerHTML = `
        <span class="sentence-slot-label">${defaultLabel}</span>
        <span class="sentence-slot-content" style="color: #94A3B8; font-style: italic;">[Letak keratan buku di sini]</span>
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
  gameState.puzzleR2Placed = [null, null, null];
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
    if (!id) return '_______';
    const item = COLLECTIBLES_R2.find(c => c.id === id);
    return item ? item.text : '_______';
  });
  previewEl.textContent = `"${parts.join(' ')}"`;
}

export function checkPuzzleR2() {
  const feedbackEl = document.getElementById('r2-feedback');

  if (gameState.puzzleR2Placed.some(s => s === null)) {
    playErrorBuzzer();
    if (feedbackEl) {
      feedbackEl.className = 'feedback-banner error';
      feedbackEl.innerHTML = '⚠️ Sila isikan ketiga-tiga komponen ayat sebelum menyemak!';
      feedbackEl.style.display = 'block';
    }
    return;
  }

  const isCorrect = gameState.puzzleR2Placed.every((id, idx) => id === PUZZLE_R2_CORRECT[idx]);

  if (isCorrect) {
    gameState.room2Completed = true;
    playSuccessFanfare();
    speakBM('Tahniah! Ayat tunggal berjaya dibina dengan susunan subjek, kata kerja, dan keterangan yang gramatis. Portal ke Bilik 3 kini dibuka.');

    const puzzleView = document.getElementById('r2-puzzle-view');
    const successView = document.getElementById('r2-success-view');
    const successScoreEl = document.getElementById('r2-success-score');

    if (puzzleView) puzzleView.style.display = 'none';
    if (successView) successView.style.display = 'block';
    if (successScoreEl) successScoreEl.textContent = `${gameScores.room2} / 30`;

    showItemToast('🌟', 'Tahniah! Ayat tunggal berjaya dibina dengan gramatis!');
  } else {
    gameScores.attemptsR2 += 1;
    // Deduct 5 marks per wrong attempt (minimum 10 marks)
    gameScores.room2 = Math.max(10, 30 - (gameScores.attemptsR2 * 5));
    updateR2ScoreDisplay();
    playErrorBuzzer();
    speakBM('Susunan ayat belum tepat. Susun mengikut subjek, kata kerja, dan objek atau keterangan.');

    if (feedbackEl) {
      feedbackEl.className = 'feedback-banner error';
      feedbackEl.innerHTML = `
        <strong>Susunan Belum Tepat!</strong> Struktur ayat tunggal Bahasa Melayu memerlukan susunan: <strong>[Subjek]</strong> (Murid-murid itu) + <strong>[Kata Kerja]</strong> (sedang membaca) + <strong>[Objek / Keterangan]</strong> (buku cerita di perpustakaan.). (-5 Markah Penalti)
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
// 10. ROOM 3 MODAL: PERIBAHASA (30 Marks)
// ==========================================
export function updateR3ScoreDisplay() {
  const scoreEl = document.getElementById('r3-live-score');
  const attemptsEl = document.getElementById('r3-attempts');
  if (scoreEl) scoreEl.textContent = `${gameScores.room3} / 30`;
  if (attemptsEl) attemptsEl.textContent = gameScores.attemptsR3;
}

export function openRoom3Modal() {
  updateR3ScoreDisplay();
  const feedback = document.getElementById('r3-feedback');
  if (feedback) feedback.style.display = 'none';
  renderR3Options();
  openModal('room3-modal');
}

export function renderR3Options() {
  // Update button classes based on state
  ['q1', 'q2'].forEach(qKey => {
    const selectedVal = gameState.quizR3Answers[qKey];
    const buttons = document.querySelectorAll(`[data-quiz-q="${qKey}"]`);
    buttons.forEach(btn => {
      if (btn.dataset.quizVal === selectedVal) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  });
}

export function selectQuizOption(qKey, val) {
  gameState.quizR3Answers[qKey] = val;
  renderR3Options();
}

export function submitQuizR3() {
  const feedbackEl = document.getElementById('r3-feedback');

  if (!gameState.quizR3Answers.q1 || !gameState.quizR3Answers.q2) {
    playErrorBuzzer();
    if (feedbackEl) {
      feedbackEl.className = 'feedback-banner error';
      feedbackEl.innerHTML = '⚠️ Sila pilih jawapan bagi kedua-dua soalan simpulan bahasa sebelum menghantar!';
      feedbackEl.style.display = 'block';
    }
    speakBM('Sila pilih jawapan bagi kedua-dua soalan simpulan bahasa sebelum menghantar.');
    return;
  }

  const isQ1Correct = (gameState.quizR3Answers.q1 === QUIZ_R3_CORRECT.q1);
  const isQ2Correct = (gameState.quizR3Answers.q2 === QUIZ_R3_CORRECT.q2);

  if (isQ1Correct && isQ2Correct) {
    // Both correct! Proceed to final PBD report
    gameState.room3Completed = true;
    playSuccessFanfare();
    speakBM('Tahniah! Anda berjaya menjawab kedua-dua soalan simpulan bahasa dengan tepat!');
    closeModal('room3-modal');

    // Trigger Final PBD Report Card!
    showFinalPBDReport();
  } else {
    // Trialogical Reflection & Retry:
    // Do NOT immediately close Room 3. Deduct 5 marks per attempt (minimum 10 marks), increment attemptsR3, play buzzer, display reflection hint.
    gameScores.attemptsR3 += 1;
    gameScores.room3 = Math.max(10, 30 - (gameScores.attemptsR3 * 5));
    updateR3ScoreDisplay();
    playErrorBuzzer();

    let hintHtml = '';
    let voiceHint = '';

    if (!isQ1Correct && !isQ2Correct) {
      hintHtml = `
        <strong>Refleksi Trialogikal:</strong> Kedua-dua jawapan anda belum tepat!<br>
        • <em>Soalan 1:</em> Fikirkan simpulan bahasa bagi orang yang sangat rajin membaca buku di perpustakaan.<br>
        • <em>Soalan 2:</em> Fikirkan simpulan bahasa bagi orang yang tidak pandai bermain bola sepak.<br>
        <span style="color: #DC2626; font-size: 11px; font-weight: 700;">(-5 Markah Penalti • Percubaan Ke-${gameScores.attemptsR3})</span>
      `;
      voiceHint = 'Refleksi: Kedua-dua soalan belum tepat. Sila rujuk nota pintar ulat buku dan kaki bangku.';
    } else if (!isQ1Correct) {
      hintHtml = `
        <strong>Refleksi Trialogikal:</strong> Soalan 1 belum tepat! (Soalan 2 anda betul: <em>Kaki Bangku</em>).<br>
        Ingat kembali Nota Pintar #1: Apakah simpulan bahasa untuk murid yang sangat gemar membaca buku cerita di perpustakaan?<br>
        <span style="color: #DC2626; font-size: 11px; font-weight: 700;">(-5 Markah Penalti • Percubaan Ke-${gameScores.attemptsR3})</span>
      `;
      voiceHint = 'Refleksi: Soalan 1 belum tepat. Fikirkan simpulan bahasa untuk orang yang suka membaca buku.';
    } else {
      hintHtml = `
        <strong>Refleksi Trialogikal:</strong> Soalan 2 belum tepat! (Soalan 1 anda betul: <em>Ulat Buku</em>).<br>
        Ingat kembali Nota Pintar #2: Apakah simpulan bahasa untuk murid yang tidak mahir bermain bola sepak di padang?<br>
        <span style="color: #DC2626; font-size: 11px; font-weight: 700;">(-5 Markah Penalti • Percubaan Ke-${gameScores.attemptsR3})</span>
      `;
      voiceHint = 'Refleksi: Soalan 2 belum tepat. Fikirkan simpulan bahasa untuk orang yang tidak pandai menendang bola.';
    }

    if (feedbackEl) {
      feedbackEl.className = 'feedback-banner error';
      feedbackEl.innerHTML = hintHtml;
      feedbackEl.style.display = 'block';
    }

    speakBM(voiceHint);
  }
}

// ==========================================
// 11. FINAL PBD REPORT CARD (report-view)
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
    rubricText = 'Tahap Penguasaan 6 (Cemerlang / Berdikari): Murid mempamerkan penguasaan menyeluruh dan cemerlang dalam sistem ejaan Jawi, sintaksis pembinaan ayat tunggal, serta pemahaman simpulan bahasa secara kontekstual melalui model pembelajaran Trialogikal berteraskan artifak digital.';
  } else if (totalScore >= 75) {
    tpLevel = 'TP 5';
    tpClass = 'tp5';
    rubricText = 'Tahap Penguasaan 5 (Sangat Baik / Terpuji): Murid berupaya menyusun huruf Jawi menjadi perkataan bermakna, mencantumkan keratan ayat dengan tepat mengikut rumus tatabahasa, serta memilih simpulan bahasa yang bersesuaian dengan senario harian.';
  } else if (totalScore >= 60) {
    tpLevel = 'TP 4';
    tpClass = 'tp4';
    rubricText = 'Tahap Penguasaan 4 (Memuaskan / Baik): Murid berupaya melengkapkan tugasan pembelajaran di bilik darjah bestari, perpustakaan, dan padang sekolah dengan menunjukkan kefahaman asas terhadap konsep bahasa Melayu.';
  } else {
    tpLevel = 'TP 3';
    tpClass = 'tp3';
    rubricText = 'Tahap Penguasaan 3 (Tahap Asas): Murid berupaya membina artifak digital bahasa pada tahap asas dengan sedikit bimbingan guru dan digalakkan untuk mengulang kaji padanan huruf Jawi dan frasa ayat.';
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
  if (scoreR1El) scoreR1El.textContent = `${gameScores.room1} / 40 (Percubaan salah: ${gameScores.attemptsR1})`;
  if (scoreR2El) scoreR2El.textContent = `${gameScores.room2} / 30 (Percubaan salah: ${gameScores.attemptsR2})`;
  if (scoreR3El) scoreR3El.textContent = `${gameScores.room3} / 30 (Percubaan salah: ${gameScores.attemptsR3})`;
  if (totalScoreEl) totalScoreEl.textContent = `${totalScore} / 100`;

  if (tpBadgeEl) {
    tpBadgeEl.textContent = tpLevel;
    tpBadgeEl.className = `tp-badge-large ${tpClass}`;
  }

  if (rubricEl) {
    rubricEl.textContent = rubricText;
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
  gameState.puzzleR2Placed = [null, null, null];
  gameState.quizR3Answers = { q1: null, q2: null };

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
  if (event.currentTarget && (event.currentTarget.classList.contains('drop-zone') || event.currentTarget.classList.contains('sentence-slot'))) {
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

window.selectQuizOption = selectQuizOption;
window.submitQuizR3 = submitQuizR3;
window.updateR3ScoreDisplay = updateR3ScoreDisplay;

window.showFinalPBDReport = showFinalPBDReport;
window.restartGame = restartGame;
window.allowDrop = allowDrop;
window.initTouchControls = initTouchControls;
