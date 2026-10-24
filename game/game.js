// ==========================================
// GAME.JS - Three.js Campus Engine & Modular Room Architecture (DSKP SP 4.4.2)
// ==========================================
import {
  PLAYER_SPEED,
  PLAYER_RADIUS,
  PICKUP_RADIUS_2D,
  ROOM_CONFIG,
  keys,
  joystickVector,
  gameState,
  COLLECTIBLES_R1,
  COLLECTIBLES_R2,
  COLLECTIBLES_R2_SESSION1,
  COLLECTIBLES_R2_SESSION2,
  COLLECTIBLES_R3,
  COLLECTIBLES_R4
} from './state.js?v=4.4.2';

import {
  registerTeleportHandlers,
  collectItem,
  showItemToast,
  playTeleportSfx,
  updateLocationBadge,
  updateMissionText,
  updatePrompt,
  updateInventoryHUD,
  handleCurrentInteraction,
  closeModal,
  registerEaselHandler,
  registerR2SessionHandler
} from './ui.js?v=4.4.2';

import { buildLobby } from './rooms/lobby.js';
import { buildRoom1, spawnR1Checkpoints } from './rooms/room1.js';
import { buildRoom2, spawnR2PictureCards } from './rooms/room2.js';
import { buildRoom3, spawnR3Scrolls } from './rooms/room3.js';
import { buildRoom4, spawnR4ArtTools, updateMasterpieceEaselTexture } from './rooms/room4.js';

// ==========================================
// 1. THREE.JS SCENE & ROBLOX 3RD-PERSON SETUP
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xBAE6FD);
scene.fog = new THREE.FogExp2(0xBAE6FD, 0.005);

// Roblox 3rd-Person PerspectiveCamera (Close-Up & Immersive)
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 800);
camera.position.set(0, 4.2, 12.0);
camera.lookAt(0, 1.4, 4.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Infinite green grass ground plane (1200x1200) under all rooms
const grassMat = new THREE.MeshLambertMaterial({ color: 0x4ADE80 });
const groundGeo = new THREE.PlaneGeometry(1200, 1200);
const groundMesh = new THREE.Mesh(groundGeo, grassMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.25;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// ==========================================
// 2. LIGHTING SETUP
// ==========================================
const ambientLight = new THREE.AmbientLight(0xFFF9F0, 0.78);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xD8F3DC, 0xFCEADE, 0.45);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xFFFAF0, 0.95);
dirLight.position.set(28, 48, 24);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -32;
dirLight.shadow.camera.right = 32;
dirLight.shadow.camera.top = 32;
dirLight.shadow.camera.bottom = -32;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 180;
dirLight.shadow.bias = -0.0004;
scene.add(dirLight);
scene.add(dirLight.target);

// ==========================================
// 3. MODULAR ROOM GROUPS & ACTIVE-ROOM SCENE CULLING
// ==========================================
export const roomGroups = {
  lobby: new THREE.Group(),
  room1: new THREE.Group(),
  room2: new THREE.Group(),
  room3: new THREE.Group(),
  room4: new THREE.Group()
};

// Add all room groups to scene
Object.values(roomGroups).forEach(group => scene.add(group));

// Per-room obstacle collision bounds
export const colliders = {
  lobby: [],
  room1: [],
  room2: [],
  room3: [],
  room4: []
};

// Build modular rooms into their dedicated room groups
const lobbyRefs = buildLobby(scene, roomGroups.lobby, colliders.lobby);
const teacherWavingArm = lobbyRefs.teacherWavingArm;
const teacherHead = lobbyRefs.teacherHead;

const r1Refs = buildRoom1(scene, roomGroups.room1, colliders.room1);
const r1AssemblyStation = r1Refs.r1AssemblyStation;
spawnR1Checkpoints(COLLECTIBLES_R1, roomGroups.room1);

const r2Refs = buildRoom2(scene, roomGroups.room2, colliders.room2);
const r2AssemblyStation = r2Refs.r2AssemblyStation;
// Sesi 1: Spawns ONLY the 4 items for Ulat Buku & Anak Emas on 4 display pedestals
spawnR2PictureCards(COLLECTIBLES_R2_SESSION1, roomGroups.room2);

const r3Refs = buildRoom3(scene, roomGroups.room3, colliders.room3);
const r3AssemblyStation = r3Refs.r3AssemblyStation;
spawnR3Scrolls(COLLECTIBLES_R3, roomGroups.room3);

const r4Refs = buildRoom4(scene, roomGroups.room4, colliders.room4);
const r4AssemblyStation = r4Refs.r4AssemblyStation;
spawnR4ArtTools(COLLECTIBLES_R4, roomGroups.room4);

// ==========================================
// 4. ROOM 2 TWO-SESSION BATCH SYSTEM
// ==========================================
export function triggerR2Session2() {
  if (gameState.r2Session === 2) return;
  gameState.r2Session = 2;
  gameState.r2Session1Completed = true;

  // Spawns the next 4 items on those exact pedestals for Buah Hati & Cahaya Mata
  spawnR2PictureCards(COLLECTIBLES_R2_SESSION2, roomGroups.room2);

  showItemToast('✨', 'Sesi 1 Selesai! 4 Objek Sesi 2 (Buah Hati & Cahaya Mata) telah muncul di bilik!');
  updateInventoryHUD();
  updateMissionText('Misi Sesi 2: Kutip 4 kad bergambar (Buah, Hati, Cahaya, Mata) di atas meja & eja di Meja Guru.');
}

// Register trigger with ui.js
registerR2SessionHandler(triggerR2Session2);

// ==========================================
// 5. PORTAL CREATION & CONNECTIONS (Placed in respective roomGroups)
// ==========================================
const portalPedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.35, 24);
const portalCoreGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.2, 16, 1, true);
const portalHaloGeo = new THREE.TorusGeometry(1.3, 0.08, 12, 32);
const portals = {};

function createPortal(key, roomId, px, pz, colorHex, emitHex) {
  const pGroup = new THREE.Group();
  pGroup.position.set(px, 0, pz);

  const ped = new THREE.Mesh(portalPedestalGeo, new THREE.MeshLambertMaterial({ color: 0x94A3B8 }));
  ped.position.y = 0.175;
  ped.receiveShadow = true;
  pGroup.add(ped);

  const core = new THREE.Mesh(portalCoreGeo, new THREE.MeshStandardMaterial({
    color: colorHex, emissive: emitHex, emissiveIntensity: 0.85, transparent: true, opacity: 0.9
  }));
  core.position.y = 1.4;
  pGroup.add(core);

  const halo = new THREE.Mesh(portalHaloGeo, new THREE.MeshStandardMaterial({
    color: 0xFDE68A, emissive: 0xF59E0B, emissiveIntensity: 0.9
  }));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 1.4;
  pGroup.add(halo);

  const light = new THREE.PointLight(colorHex, 1.8, 7);
  light.position.set(0, 2.0, 0);
  pGroup.add(light);

  // Add portal to its specific roomGroup for active-room culling
  roomGroups[roomId].add(pGroup);
  colliders[roomId].push({ minX: px - 1.2, maxX: px + 1.2, minZ: pz - 1.2, maxZ: pz + 1.2 });

  portals[key] = { group: pGroup, core, halo, light, roomId };
  return portals[key];
}

// 1. Lobby Portal -> Teleports to Room 1
createPortal('portalR1', 'lobby', 4.5, 2.0, 0x06D6A0, 0x05B386);

// 2. Room 1 Exit Portal -> Teleports to Room 2
createPortal('portalR2', 'room1', 114.5, 88.0, 0x3B82F6, 0x2563EB);

// 3. Room 2 Exit Portal -> Teleports to Room 3
createPortal('portalR3', 'room2', 206.5, 194.0, 0x10B981, 0x059669);

// 4. Room 3 Exit Portal -> Teleports to Room 4
createPortal('portalR4', 'room3', 306.5, 294.0, 0xF59E0B, 0xD97706);

// 5. Room 4 Return Portal -> Teleports back to Lobby
createPortal('returnLobby', 'room4', 406.5, 394.0, 0x8B5CF6, 0x7C3AED);

// ==========================================
// 6. 3D PLAYER AVATAR SETUP (ANIMATED MALAYSIAN SCHOOL STUDENT)
// ==========================================
const playerGroup = new THREE.Group();
playerGroup.position.set(0, 0, 4.5);
scene.add(playerGroup);

// Limb Pivot References for Natural Movement Animation
let leftArmPivot, rightArmPivot;
let leftLegPivot, rightLegPivot;

// Upper Body & Torso Group (bobs slightly when moving)
const playerBody = new THREE.Group();
playerBody.position.y = 0.65;
playerGroup.add(playerBody);

// Materials for Malaysian School Uniform
const shirtMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // White short-sleeve school shirt
const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1E3A8A }); // Navy blue primary school pants
const skinMat = new THREE.MeshLambertMaterial({ color: 0xFDE68A });  // Warm skin tone
const tieMat = new THREE.MeshLambertMaterial({ color: 0xDC2626 });   // Red school tie
const darkMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });    // Eyes & school shoes
const hairMat = new THREE.MeshLambertMaterial({ color: 0x1E293B });  // Dark hair
const backpackMat = new THREE.MeshLambertMaterial({ color: 0x2563EB }); // Royal blue school backpack
const bagPocketMat = new THREE.MeshLambertMaterial({ color: 0xF59E0B }); // Amber pocket accent

// 1. Torso / White Short-Sleeve School Shirt
const shirtMesh = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.52, 0.42), shirtMat);
shirtMesh.position.y = 0.26;
shirtMesh.castShadow = true;
shirtMesh.receiveShadow = true;
playerBody.add(shirtMesh);

// Navy Blue Belt / Waistband
const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.44), pantsMat);
beltMesh.position.y = 0.02;
playerBody.add(beltMesh);

// Red School Tie on Front (-Z)
const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.05), tieMat);
tieKnot.position.set(0, 0.46, -0.23);
playerBody.add(tieKnot);

const tieBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.04), tieMat);
tieBody.position.set(0, 0.3, -0.23);
playerBody.add(tieBody);

// School Badge on Left Chest
const badge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.02), bagPocketMat);
badge.position.set(-0.18, 0.38, -0.22);
playerBody.add(badge);

// 2. 3D School Backpack on back (z = +0.32)
const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.26), backpackMat);
backpack.position.set(0, 0.26, 0.32);
backpack.castShadow = true;
playerBody.add(backpack);

const bagPocket = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.1), bagPocketMat);
bagPocket.position.set(0, 0.18, 0.47);
playerBody.add(bagPocket);

[-0.2, 0.2].forEach((sx) => {
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.04), backpackMat);
  strap.position.set(sx, 0.28, -0.21);
  playerBody.add(strap);
});

// 3. Head with Cap & Hair
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 8), skinMat);
neck.position.set(0, 0.56, 0);
playerBody.add(neck);

const headGroup = new THREE.Group();
headGroup.position.set(0, 0.82, 0);
playerBody.add(headGroup);

const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.44), skinMat);
headMesh.castShadow = true;
headGroup.add(headMesh);

// Cute Eyes
const eyeGeo = new THREE.BoxGeometry(0.08, 0.12, 0.04);
const leftEye = new THREE.Mesh(eyeGeo, darkMat);
leftEye.position.set(-0.12, 0.02, -0.23);
headGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeo, darkMat);
rightEye.position.set(0.12, 0.02, -0.23);
headGroup.add(rightEye);

// Cute Blush Cheeks
const blushGeo = new THREE.BoxGeometry(0.08, 0.04, 0.02);
const blushMat = new THREE.MeshBasicMaterial({ color: 0xF472B6 });
const leftBlush = new THREE.Mesh(blushGeo, blushMat);
leftBlush.position.set(-0.16, -0.06, -0.23);
headGroup.add(leftBlush);

const rightBlush = new THREE.Mesh(blushGeo, blushMat);
rightBlush.position.set(0.16, -0.06, -0.23);
headGroup.add(rightBlush);

// Cute Smile
const smile = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: 0xE11D48 }));
smile.position.set(0, -0.1, -0.23);
headGroup.add(smile);

// Dark Student Hair & Cap
const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.52), hairMat);
hairTop.position.set(0, 0.2, 0);
headGroup.add(hairTop);

const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.3, 0.16), hairMat);
hairBack.position.set(0, 0.05, 0.18);
headGroup.add(hairBack);

const hairBangs = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.08), hairMat);
hairBangs.position.set(0, 0.16, -0.22);
headGroup.add(hairBangs);

const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.18), pantsMat);
capVisor.position.set(0, 0.22, -0.26);
headGroup.add(capVisor);

// 4. Arms (Shoulder Pivots)
function makeStudentArm(isLeft) {
  const armPivot = new THREE.Group();
  const armX = isLeft ? -0.42 : 0.42;
  armPivot.position.set(armX, 0.44, 0);

  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.22), shirtMat);
  sleeve.position.y = -0.08;
  armPivot.add(sleeve);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.16), skinMat);
  arm.position.y = -0.28;
  armPivot.add(arm);

  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), skinMat);
  hand.position.y = -0.44;
  armPivot.add(hand);

  return armPivot;
}

leftArmPivot = makeStudentArm(true);
rightArmPivot = makeStudentArm(false);
playerBody.add(leftArmPivot);
playerBody.add(rightArmPivot);

// 5. Legs (Hip Pivots)
function makeStudentLeg(isLeft) {
  const legPivot = new THREE.Group();
  const legX = isLeft ? -0.17 : 0.17;
  legPivot.position.set(legX, 0.65, 0);

  const pantsLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.44, 0.3), pantsMat);
  pantsLeg.position.y = -0.22;
  pantsLeg.castShadow = true;
  legPivot.add(pantsLeg);

  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.2), skinMat);
  leg.position.y = -0.46;
  legPivot.add(leg);

  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.34), darkMat);
  shoe.position.set(0, -0.58, -0.06);
  shoe.castShadow = true;
  legPivot.add(shoe);

  return legPivot;
}

leftLegPivot = makeStudentLeg(true);
rightLegPivot = makeStudentLeg(false);
playerGroup.add(leftLegPivot);
playerGroup.add(rightLegPivot);

// ==========================================
// 7. DYNAMIC 3D FLOOR GUIDE ARROW (ANAK PANAH PANDUAN)
// ==========================================
const guideArrowGroup = new THREE.Group();
guideArrowGroup.position.set(0, 0.25, 4.5);
scene.add(guideArrowGroup);

const arrowMeshContainer = new THREE.Group();
const arrowMat = new THREE.MeshStandardMaterial({
  color: 0xF59E0B,
  emissive: 0xF59E0B,
  emissiveIntensity: 0.85,
  metalness: 0.3,
  roughness: 0.2
});

const arrowHeadGeo = new THREE.ConeGeometry(0.55, 0.95, 4);
const arrowHeadMesh = new THREE.Mesh(arrowHeadGeo, arrowMat);
arrowHeadMesh.rotation.x = -Math.PI / 2;
arrowHeadMesh.position.set(0, 0, -1.9);
arrowMeshContainer.add(arrowHeadMesh);

const arrowStemGeo = new THREE.BoxGeometry(0.26, 0.12, 1.1);
const arrowStemMesh = new THREE.Mesh(arrowStemGeo, arrowMat);
arrowStemMesh.position.set(0, 0, -1.0);
arrowMeshContainer.add(arrowStemMesh);

const arrowGlowLight = new THREE.PointLight(0xF59E0B, 1.2, 3.5);
arrowGlowLight.position.set(0, 0.2, 0);
arrowMeshContainer.add(arrowGlowLight);

guideArrowGroup.add(arrowMeshContainer);

// ==========================================
// 8. TELEPORTATION & ACTIVE-ROOM SCENE CULLING SYSTEM
// ==========================================
export function teleportTo(roomId) {
  const targetRoom = ROOM_CONFIG[roomId];
  if (!targetRoom) return;

  playTeleportSfx();
  gameState.currentRoom = roomId;

  // Active-Room Scene Culling: Set roomGroups[key].visible = (key === roomId)
  // This reduces active polygons and point lights by 80%, keeping frame rate locked at 60fps
  Object.keys(roomGroups).forEach((key) => {
    roomGroups[key].visible = (key === roomId);
  });

  const { x: sx, z: sz } = targetRoom.spawn;
  playerGroup.position.set(sx, 0, sz);
  if (guideArrowGroup) {
    guideArrowGroup.position.set(sx, 0.25, sz);
  }

  playerGroup.rotation.y = 0; // Face forward (-Z)
  camera.position.set(sx, 4.5, sz + 7.5);
  camera.lookAt(sx, 1.2, sz);

  updateLocationBadge(targetRoom.badge, roomId !== 'lobby');
  updateInventoryHUD();
  showItemToast('✨', `Selamat Datang ke ${targetRoom.name}!`);

  if (roomId === 'room1') {
    updateMissionText('Misi: Terokai Taman Pagar Sesat Jawi & kutip 10 kumpulan huruf secara berperingkat (Alif hingga Ya/Nya).');
  } else if (roomId === 'room2') {
    updateMissionText(gameState.r2Session === 1
      ? 'Misi Sesi 1: Kutip 4 kad bergambar (Ulat, Buku, Anak, Emas) di atas meja & eja di Meja Guru.'
      : 'Misi Sesi 2: Kutip 4 kad bergambar (Buah, Hati, Cahaya, Mata) di atas meja & eja di Meja Guru.');
  } else if (roomId === 'room3') {
    updateMissionText('Misi: Cari 4 gulungan simpulan bahasa di Arkib & padankan dengan maksudnya di Meja Bacaan.');
  } else if (roomId === 'room4') {
    updateMissionText('Misi: Kumpul 3 alatan seni khat & persembahkan karya kaligrafi di Kanvas Utama (SP 4.4.2).');
  } else {
    updateMissionText('Misi: Terokai dataran & dekati portal bercahaya untuk ke Bilik 1.');
  }
}

// Register teleport handlers with ui.js
registerTeleportHandlers({
  toLobby: () => teleportTo('lobby'),
  toRoom1: () => teleportTo('room1'),
  toRoom2: () => teleportTo('room2'),
  toRoom3: () => teleportTo('room3'),
  toRoom4: () => teleportTo('room4')
});

registerEaselHandler(updateMasterpieceEaselTexture);

// ==========================================
// 9. COLLISION DETECTION (Checks ONLY Active-Room Colliders)
// ==========================================
function checkWallCollision(nextX, nextZ) {
  const safe = PLAYER_RADIUS;
  const room = ROOM_CONFIG[gameState.currentRoom] || ROOM_CONFIG.lobby;
  const { minX, maxX, minZ, maxZ } = room.bounds;

  // Platform perimeter boundary check
  if (nextX < minX + safe || nextX > maxX - safe) return true;
  if (nextZ < minZ + safe || nextZ > maxZ - safe) return true;

  // ONLY check colliders for the active room
  const activeColliders = colliders[gameState.currentRoom] || [];
  for (let i = 0; i < activeColliders.length; i++) {
    const c = activeColliders[i];
    if (
      nextX + safe > c.minX &&
      nextX - safe < c.maxX &&
      nextZ + safe > c.minZ &&
      nextZ - safe < c.maxZ
    ) {
      return true;
    }
  }

  return false;
}

// ==========================================
// 10. INPUT HANDLING
// ==========================================
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
  if (keys.hasOwnProperty(key)) keys[key] = true;

  if ((e.key === 'e' || e.key === 'E') && !gameState.activeModal) {
    handleCurrentInteraction();
  }

  if (e.key === 'Escape' && gameState.activeModal) {
    closeModal(gameState.activeModal);
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
  if (keys.hasOwnProperty(key)) keys[key] = false;
});

// ==========================================
// 11. GAME LOOP & ANIMATION (Optimized with Zero Runtime Texture Allocations)
// ==========================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Active Portal Animation (Only animate portal in the current visible room)
  const activePortalMap = {
    lobby: portals.portalR1,
    room1: portals.portalR2,
    room2: portals.portalR3,
    room3: portals.portalR4,
    room4: portals.returnLobby
  };
  const activePortal = activePortalMap[gameState.currentRoom];
  if (activePortal) {
    activePortal.core.rotation.y += 1.8 * delta;
    activePortal.halo.rotation.z += 1.2 * delta;
    const bob = Math.sin(time * 3.0) * 0.14;
    activePortal.core.position.y = 1.4 + bob;
    activePortal.halo.position.y = 1.4 + bob;
    activePortal.light.intensity = 1.5 + Math.sin(time * 4.0) * 0.35;
  }

  // Active Assembly Station Beacon Animations
  if (gameState.currentRoom === 'room1' && r1AssemblyStation) {
    r1AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r1AssemblyStation.beacon.position.y = 3.4 + Math.sin(time * 2.8) * 0.12;
  } else if (gameState.currentRoom === 'room2' && r2AssemblyStation) {
    r2AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r2AssemblyStation.beacon.position.y = 2.3 + Math.sin(time * 2.8) * 0.12;
  } else if (gameState.currentRoom === 'room3' && r3AssemblyStation) {
    r3AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r3AssemblyStation.beacon.position.y = 2.3 + Math.sin(time * 2.8) * 0.12;
  } else if (gameState.currentRoom === 'room4' && r4AssemblyStation) {
    r4AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r4AssemblyStation.beacon.position.y = 3.2 + Math.sin(time * 2.8) * 0.12;
  }

  // Teacher NPC Gentle Idle Waving (Lobby only)
  if (gameState.currentRoom === 'lobby') {
    if (teacherWavingArm) {
      teacherWavingArm.rotation.z = Math.sin(time * 3.2) * 0.28 + 0.45;
      teacherWavingArm.rotation.x = Math.cos(time * 3.2) * 0.15;
    }
    if (teacherHead) {
      teacherHead.rotation.y = Math.sin(time * 1.6) * 0.12;
    }
  }

  // Active Collectibles Loop (Based strictly on current active room)
  let activeCollectibles = [];
  if (gameState.currentRoom === 'room1') {
    activeCollectibles = COLLECTIBLES_R1;
  } else if (gameState.currentRoom === 'room2') {
    // Collectibles in Room 2 that currently have 3D meshes instantiated
    activeCollectibles = COLLECTIBLES_R2.filter(it => it.mesh !== null);
  } else if (gameState.currentRoom === 'room3') {
    activeCollectibles = COLLECTIBLES_R3;
  } else if (gameState.currentRoom === 'room4') {
    activeCollectibles = COLLECTIBLES_R4;
  }

  // For Room 1: Find sequential active checkpoint index (0 to 9)
  const activeR1Index = COLLECTIBLES_R1.findIndex(it => !it.collected);

  activeCollectibles.forEach((item, index) => {
    if (!item.collected && item.mesh) {
      if (item.gemMesh) item.gemMesh.rotation.y += 1.8 * delta;
      if (item.ringMesh) item.ringMesh.rotation.z += 1.5 * delta;
      const bob = Math.sin(time * 3.0 + index) * 0.14;
      item.mesh.position.y = item.pos.y + bob;

      // Sequential Pickup Check for Room 1
      if (gameState.currentRoom === 'room1') {
        const isCurrentActive = (index === activeR1Index);
        if (isCurrentActive) {
          // Highlight active checkpoint with bright gold beacon pulse
          if (item.ringMesh && item.ringMesh.material) {
            item.ringMesh.material.color.setHex(0xF59E0B);
            item.ringMesh.material.emissive.setHex(0xF59E0B);
            item.ringMesh.material.emissiveIntensity = 1.0 + Math.sin(time * 6.0) * 0.4;
          }
          if (item.pointLight) item.pointLight.intensity = 2.4;

          const dx = playerGroup.position.x - item.mesh.position.x;
          const dz = playerGroup.position.z - item.mesh.position.z;
          const dist2D = Math.hypot(dx, dz);
          if (dist2D < PICKUP_RADIUS_2D) {
            collectItem(item, 'room1');
            gameState.currentR1Step = index + 2;
          }
        } else {
          // Locked checkpoint: Dimmed beacon
          if (item.ringMesh && item.ringMesh.material) {
            item.ringMesh.material.color.setHex(0x64748B);
            item.ringMesh.material.emissive.setHex(0x334155);
            item.ringMesh.material.emissiveIntensity = 0.3;
          }
          if (item.pointLight) item.pointLight.intensity = 0.6;
        }
      } else {
        // Standard 2D pickup check for Room 2, 3, 4
        const dx = playerGroup.position.x - item.mesh.position.x;
        const dz = playerGroup.position.z - item.mesh.position.z;
        const dist2D = Math.hypot(dx, dz);
        if (dist2D < PICKUP_RADIUS_2D) {
          collectItem(item, gameState.currentRoom);
        }
      }
    } else if (item.isPopping && item.mesh) {
      item.popScale += 4.0 * delta;
      item.mesh.scale.setScalar(item.popScale);
      item.mesh.position.y += 3.0 * delta;
      if (item.popScale > 2.2) {
        item.isPopping = false;
        item.mesh.visible = false;
      }
    }
  });

  // Player Movement (Roblox 3rd-Person Front View Axes & Mobile Virtual Joystick)
  if (!gameState.activeModal) {
    let inputX = 0;
    let inputZ = 0;

    if (joystickVector && joystickVector.active) {
      inputX = joystickVector.x;
      inputZ = joystickVector.z;
    } else {
      if (keys.w || keys.ArrowUp) { inputZ -= 1; }
      if (keys.s || keys.ArrowDown) { inputZ += 1; }
      if (keys.a || keys.ArrowLeft) { inputX -= 1; }
      if (keys.d || keys.ArrowRight) { inputX += 1; }
    }

    if (inputX !== 0 || inputZ !== 0) {
      const length = Math.hypot(inputX, inputZ);
      const speedFactor = (joystickVector && joystickVector.active) ? Math.min(1.0, length) : 1.0;
      const moveX = (inputX / length) * PLAYER_SPEED * speedFactor;
      const moveZ = (inputZ / length) * PLAYER_SPEED * speedFactor;

      const targetX = playerGroup.position.x + moveX;
      const targetZ = playerGroup.position.z + moveZ;

      if (!checkWallCollision(targetX, playerGroup.position.z)) {
        playerGroup.position.x = targetX;
      }
      if (!checkWallCollision(playerGroup.position.x, targetZ)) {
        playerGroup.position.z = targetZ;
      }

      const targetAngle = Math.atan2(moveX, moveZ) + Math.PI;
      let angleDiff = targetAngle - playerGroup.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      playerGroup.rotation.y += angleDiff * 0.25;

      const swing = Math.sin(time * 12) * 0.45;
      if (leftLegPivot && rightLegPivot) {
        leftLegPivot.rotation.x = swing;
        rightLegPivot.rotation.x = -swing;
      }
      if (leftArmPivot && rightArmPivot) {
        leftArmPivot.rotation.x = -swing;
        rightArmPivot.rotation.x = swing;
      }
      playerBody.position.y = 0.65 + Math.abs(Math.sin(time * 12)) * 0.08;
    } else {
      if (leftLegPivot && rightLegPivot) {
        leftLegPivot.rotation.x *= 0.8;
        rightLegPivot.rotation.x *= 0.8;
      }
      if (leftArmPivot && rightArmPivot) {
        leftArmPivot.rotation.x = Math.sin(time * 2.2) * 0.06;
        rightArmPivot.rotation.x = -Math.sin(time * 2.2) * 0.06;
      }
      playerBody.position.y = 0.65 + Math.sin(time * 2.5) * 0.02;
    }
  }

  // Dynamic 3D Floor Guide Arrow (Anak Panah Panduan)
  if (guideArrowGroup) {
    guideArrowGroup.position.set(playerGroup.position.x, 0.25, playerGroup.position.z);
    arrowMeshContainer.position.y = Math.sin(time * 4.0) * 0.04;

    let arrowTarget = null;

    if (gameState.currentRoom === 'lobby') {
      arrowTarget = portals.portalR1.group.position;
    } else if (gameState.currentRoom === 'room1') {
      const activeCheckpoint = COLLECTIBLES_R1.find(item => !item.collected);
      if (activeCheckpoint) {
        arrowTarget = activeCheckpoint.pos;
      } else if (!gameState.room1Completed) {
        arrowTarget = r1AssemblyStation.group.position;
      } else {
        arrowTarget = portals.portalR2.group.position;
      }
    } else if (gameState.currentRoom === 'room2') {
      // In Room 2: points to uncollected items in current active session
      const currentSessionItems = gameState.r2Session === 1 ? COLLECTIBLES_R2_SESSION1 : COLLECTIBLES_R2_SESSION2;
      const uncollected = currentSessionItems.filter(item => !item.collected);
      if (uncollected.length > 0) {
        let nearest = uncollected[0];
        let minDist = Infinity;
        uncollected.forEach(item => {
          const d = Math.hypot(playerGroup.position.x - item.pos.x, playerGroup.position.z - item.pos.z);
          if (d < minDist) {
            minDist = d;
            nearest = item;
          }
        });
        arrowTarget = nearest.pos;
      } else if (!gameState.room2Completed) {
        arrowTarget = r2AssemblyStation.group.position;
      } else {
        arrowTarget = portals.portalR3.group.position;
      }
    } else if (gameState.currentRoom === 'room3') {
      const uncollected = COLLECTIBLES_R3.filter(item => !item.collected);
      if (uncollected.length > 0) {
        let nearest = uncollected[0];
        let minDist = Infinity;
        uncollected.forEach(item => {
          const d = Math.hypot(playerGroup.position.x - item.pos.x, playerGroup.position.z - item.pos.z);
          if (d < minDist) {
            minDist = d;
            nearest = item;
          }
        });
        arrowTarget = nearest.pos;
      } else if (!gameState.room3Completed) {
        arrowTarget = r3AssemblyStation.group.position;
      } else {
        arrowTarget = portals.portalR4.group.position;
      }
    } else if (gameState.currentRoom === 'room4') {
      const uncollected = COLLECTIBLES_R4.filter(item => !item.collected);
      if (uncollected.length > 0) {
        let nearest = uncollected[0];
        let minDist = Infinity;
        uncollected.forEach(item => {
          const d = Math.hypot(playerGroup.position.x - item.pos.x, playerGroup.position.z - item.pos.z);
          if (d < minDist) {
            minDist = d;
            nearest = item;
          }
        });
        arrowTarget = nearest.pos;
      } else if (!gameState.room4Completed) {
        arrowTarget = r4AssemblyStation.group.position;
      } else {
        arrowTarget = portals.returnLobby.group.position;
      }
    }

    if (arrowTarget) {
      guideArrowGroup.visible = true;
      const dx = arrowTarget.x - playerGroup.position.x;
      const dz = arrowTarget.z - playerGroup.position.z;
      const targetAngle = Math.atan2(dx, dz) + Math.PI;

      let angleDiff = targetAngle - guideArrowGroup.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      guideArrowGroup.rotation.y += angleDiff * 0.15;
    } else {
      guideArrowGroup.visible = false;
    }
  }

  // Proximity Detection for Portals & Assembly Stations
  let foundTarget = null;
  let promptText = '';

  if (gameState.currentRoom === 'lobby') {
    const dPortal = playerGroup.position.distanceTo(portals.portalR1.group.position);
    const dTeacher = playerGroup.position.distanceTo(new THREE.Vector3(2.0, 0, -3.2));
    const dNotice = playerGroup.position.distanceTo(new THREE.Vector3(-9.2, 0, -1.0));

    if (dTeacher <= 2.6) {
      foundTarget = 'npcTeacher';
      promptText = 'Tekan E untuk Bicara dengan Cikgu Asyikin';
    } else if (dNotice <= 3.4) {
      foundTarget = 'noticeboard';
      promptText = 'Tekan E untuk Baca Papan Kenyataan Sekolah';
    } else if (dPortal <= 2.6) {
      foundTarget = 'portalR1';
      promptText = 'Tekan E untuk Masuk ke Bilik 1 (Taman Pagar Sesat Jawi)';
    }
  } else if (gameState.currentRoom === 'room1') {
    const dTable = playerGroup.position.distanceTo(r1AssemblyStation.group.position);
    const dPortal = playerGroup.position.distanceTo(portals.portalR2.group.position);
    if (dTable <= 3.2) {
      foundTarget = 'tableR1';
      promptText = 'Tekan E untuk Buka Papan Pintar 37 Huruf Jawi';
    } else if (dPortal <= 2.6) {
      foundTarget = 'portalR2';
      promptText = 'Tekan E untuk Masuk ke Bilik 2 (Makmal Kata Jawi)';
    }
  } else if (gameState.currentRoom === 'room2') {
    const dTable = playerGroup.position.distanceTo(r2AssemblyStation.group.position);
    const dPortal = playerGroup.position.distanceTo(portals.portalR3.group.position);
    if (dTable <= 3.2) {
      foundTarget = 'tableR2';
      promptText = 'Tekan E untuk Buka Meja Cantuman Kata Jawi';
    } else if (dPortal <= 2.6) {
      foundTarget = 'portalR3';
      promptText = 'Tekan E untuk Masuk ke Bilik 3 (Arkib Simpulan Bahasa)';
    }
  } else if (gameState.currentRoom === 'room3') {
    const dTable = playerGroup.position.distanceTo(r3AssemblyStation.group.position);
    const dPortal = playerGroup.position.distanceTo(portals.portalR4.group.position);
    if (dTable <= 3.2) {
      foundTarget = 'tableR3';
      promptText = 'Tekan E untuk Padankan Simpulan Bahasa di Meja Bacaan';
    } else if (dPortal <= 2.6) {
      foundTarget = 'portalR4';
      promptText = 'Tekan E untuk Masuk ke Bilik 4 (Studio Persembahan Seni Khat)';
    }
  } else if (gameState.currentRoom === 'room4') {
    const dTable = playerGroup.position.distanceTo(r4AssemblyStation.group.position);
    const dReturn = playerGroup.position.distanceTo(portals.returnLobby.group.position);
    if (dTable <= 3.4) {
      foundTarget = 'tableR4';
      promptText = 'Tekan E untuk Hasilkan Karya Seni Khat Jawi (Kanvas Pameran Utama)';
    } else if (dReturn <= 2.6) {
      foundTarget = 'returnLobby';
      promptText = 'Tekan E untuk Kembali ke Dataran Sekolah (Laporan PBD)';
    }
  }

  gameState.nearbyTarget = foundTarget;
  updatePrompt(promptText, foundTarget !== null);

  // Sunlight and Close-Up Roblox 3rd-Person Camera Follow
  dirLight.position.set(playerGroup.position.x + 16, 32, playerGroup.position.z + 20);
  dirLight.target.position.copy(playerGroup.position);

  const targetCamX = playerGroup.position.x;
  const targetCamY = playerGroup.position.y + 4.2;
  const targetCamZ = playerGroup.position.z + 7.5;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.14);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.14);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.14);
  camera.lookAt(playerGroup.position.x, 1.4, playerGroup.position.z);

  renderer.render(scene, camera);
}

// Window resize handler for PerspectiveCamera
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial active room visibility: only lobby visible at startup
Object.keys(roomGroups).forEach((key) => {
  roomGroups[key].visible = (key === 'lobby');
});

// Initialize dynamic HUD
updateInventoryHUD();

// Start Game Loop
animate();
