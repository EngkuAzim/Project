// ==========================================
// GAME.JS - Three.js Campus Engine, Diorama Architecture & Loop (DSKP SP 4.4.2)
// ==========================================
import {
  PLAYER_SPEED,
  PLAYER_RADIUS,
  PICKUP_RADIUS_2D,
  ROOM_CONFIG,
  keys,
  gameState,
  COLLECTIBLES_R1,
  COLLECTIBLES_R2,
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
  registerEaselHandler
} from './ui.js?v=4.4.2';

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

// Obstacle Colliders Array
const colliders = [];

// ==========================================
// 2.5 REUSABLE 3D TEXT & CANVAS TEXTURE HELPERS
// ==========================================
export function createTextCanvasTexture(text, bgColor = '#1E3A8A', textColor = '#FFFFFF', width = 1024, height = 256, fontSize = 56, subtitle = '') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Outer Gold Decorative Border
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  // Inner Accent Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Text Styling
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px "Fredoka", "Plus Jakarta Sans", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (subtitle) {
    ctx.fillText(text, width / 2, height / 2 - fontSize * 0.32);
    ctx.fillStyle = '#FDE68A';
    ctx.font = `600 ${Math.round(fontSize * 0.44)}px "Plus Jakarta Sans", Arial, sans-serif`;
    ctx.fillText(subtitle, width / 2, height / 2 + fontSize * 0.52);
  } else {
    ctx.fillText(text, width / 2, height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createTextSprite(text, bgColor = 'rgba(15, 23, 42, 0.94)', textColor = '#FFFFFF', width = 512, height = 180, fontSize = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Rounded Pill Background
  const r = height / 2 - 10;
  const x = 12, y = 10, w = width - 24, h = height - 20;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px "Fredoka", "Plus Jakarta Sans", "Amiri", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  return new THREE.Sprite(spriteMat);
}

export function createJawiTileTexture(char, name, colorHex = '#2563EB') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Rich parchment gradient background
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#FFFBEB');
  grad.addColorStop(1, '#FEF3C7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Ornate double border
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 18;
  ctx.strokeRect(16, 16, 480, 480);

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 6;
  ctx.strokeRect(32, 32, 448, 448);

  // Large Calligraphic Jawi Character
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 200px "Amiri", "Traditional Arabic", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 256, 215);

  // Rumi Name Banner
  ctx.fillStyle = colorHex;
  ctx.fillRect(40, 390, 432, 85);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 44px "Fredoka", "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(name.toUpperCase(), 256, 435);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// 3. ILLUSTRATED CARD TEXTURE FOR ROOM 2 (Makmal Kata Visual: 8 Literal Objects)
export function createIllustratedCardTexture(item) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  // Card Background: Off-white parchment
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 640);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(1, '#FFFBEB');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 640);

  // Gold Card Border
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 14;
  ctx.strokeRect(12, 12, 488, 616);

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, 460, 588);

  // Top Jawi Banner
  const hexColor = '#' + item.color.toString(16).padStart(6, '0');
  ctx.fillStyle = hexColor;
  ctx.fillRect(36, 36, 440, 110);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 74px "Amiri", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.jawi, 256, 92);

  // Center Circular Spotlight for Emoji / Illustration
  ctx.beginPath();
  ctx.arc(256, 310, 125, 0, Math.PI * 2);
  ctx.fillStyle = '#FEF3C7';
  ctx.fill();
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Big Cute Emoji Illustration
  ctx.font = '130px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.char, 256, 315);

  // Rumi Word Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 56px "Fredoka", "Plus Jakarta Sans", sans-serif';
  ctx.fillText(item.rumi.toUpperCase(), 256, 485);

  // Letters breakdown pill (e.g., "ا • و • ل • ت")
  ctx.fillStyle = '#1E293B';
  const pillW = 380, pillH = 50, pillX = 66, pillY = 535, pillR = 25;
  ctx.beginPath();
  ctx.moveTo(pillX + pillR, pillY);
  ctx.lineTo(pillX + pillW - pillR, pillY);
  ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + pillR);
  ctx.lineTo(pillX + pillW, pillY + pillH - pillR);
  ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - pillR, pillY + pillH);
  ctx.lineTo(pillX + pillR, pillY + pillH);
  ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - pillR);
  ctx.lineTo(pillX, pillY + pillR);
  ctx.quadraticCurveTo(pillX, pillY, pillX + pillR, pillY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 30px "Amiri", sans-serif';
  ctx.fillText(item.letters.join('  •  '), 256, 560);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// Masterpiece Canvas Mesh Reference for Room 4 dynamic updates
let masterpieceCanvasMesh = null;

export function updateMasterpieceEaselTexture(dataUrl) {
  if (!masterpieceCanvasMesh) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const tex = new THREE.Texture(img);
    tex.needsUpdate = true;
    masterpieceCanvasMesh.material.map = tex;
    masterpieceCanvasMesh.material.needsUpdate = true;
  };
  img.src = dataUrl;
}

// ==========================================
// 4. CUTAWAY DIORAMA ARCHITECTURE BUILDER
// ==========================================
function buildCutawayRoomShell(cx, cz, floorColor, northWallColor, westWallColor, trimColor = 0xA0AEC0, width = 26, depth = 22) {
  const hw = width / 2;
  const hd = depth / 2;

  // Floor Platform
  const floorGeo = new THREE.BoxGeometry(width, 0.4, depth);
  const floorMat = new THREE.MeshLambertMaterial({ color: floorColor });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(cx, 0.2, cz);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Outer Platform Base
  const baseGeo = new THREE.BoxGeometry(width + 0.8, 0.6, depth + 0.8);
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(cx, -0.1, cz);
  scene.add(baseMesh);

  // North Back Wall (z = cz - hd)
  const nWallGeo = new THREE.BoxGeometry(width, 5.5, 0.5);
  const nWallMat = new THREE.MeshLambertMaterial({ color: northWallColor });
  const nWallMesh = new THREE.Mesh(nWallGeo, nWallMat);
  nWallMesh.position.set(cx, 2.95, cz - hd);
  nWallMesh.castShadow = true;
  nWallMesh.receiveShadow = true;
  scene.add(nWallMesh);

  // West Side Wall (x = cx - hw)
  const wWallGeo = new THREE.BoxGeometry(0.5, 5.5, depth);
  const wWallMat = new THREE.MeshLambertMaterial({ color: westWallColor });
  const wWallMesh = new THREE.Mesh(wWallGeo, wWallMat);
  wWallMesh.position.set(cx - hw, 2.95, cz);
  wWallMesh.castShadow = true;
  wWallMesh.receiveShadow = true;
  scene.add(wWallMesh);

  // Wall Baseboards / Trims
  const nTrim = new THREE.Mesh(new THREE.BoxGeometry(width, 0.35, 0.55), new THREE.MeshLambertMaterial({ color: trimColor }));
  nTrim.position.set(cx, 0.55, cz - hd);
  scene.add(nTrim);

  const wTrim = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, depth), new THREE.MeshLambertMaterial({ color: trimColor }));
  wTrim.position.set(cx - hw, 0.55, cz);
  scene.add(wTrim);

  // Register physical collision boxes for walls
  colliders.push({ minX: cx - hw - 0.5, maxX: cx + hw + 0.5, minZ: cz - hd - 0.5, maxZ: cz - hd + 0.5 });
  colliders.push({ minX: cx - hw - 0.5, maxX: cx - hw + 0.5, minZ: cz - hd - 0.5, maxZ: cz + hd + 0.5 });
}

// Assembly Stations references
let r1AssemblyStation = null;
let r2AssemblyStation = null;
let r3AssemblyStation = null;
let r4AssemblyStation = null;

// Teacher NPC animated limb references
let teacherWavingArm = null;
let teacherHead = null;

// ==========================================
// 5. AREA 0: DATARAN SEKOLAH (LOBBY AT 0, 0)
// ==========================================
function buildLobby() {
  const cx = 0, cz = 0;
  buildCutawayRoomShell(cx, cz, 0xE2E8F0, 0x1E3A8A, 0x1E40AF, 0x64748B);

  // Main School Building Facade on North Wall
  const bannerTex = createTextCanvasTexture(
    'KEMBARA BAHASA SEKOLAH BESTARI',
    '#1E3A8A',
    '#FFFFFF',
    1024,
    256,
    48,
    'Inovasi Digital PdP Bahasa Melayu • Standard Pembelajaran 4.4.2'
  );
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(16.5, 3.8),
    new THREE.MeshBasicMaterial({ map: bannerTex })
  );
  bannerMesh.position.set(cx, 3.6, cz - 10.7);
  scene.add(bannerMesh);

  // Jalur Gemilang Flagpole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7.5, 12), new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.8 }));
  pole.position.set(-8.5, 3.75, -5.5);
  scene.add(pole);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.04), new THREE.MeshLambertMaterial({ color: 0xDC2626 }));
  flag.position.set(-7.5, 6.7, -5.5);
  scene.add(flag);

  // Dataran Planters
  [-9.5, 9.5].forEach((px) => {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.8), new THREE.MeshLambertMaterial({ color: 0x78350F }));
    planter.position.set(px, 0.65, 4.0);
    scene.add(planter);

    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10), new THREE.MeshLambertMaterial({ color: 0x15803D }));
    bush.position.set(px, 1.5, 4.0);
    scene.add(bush);
    colliders.push({ minX: px - 1.0, maxX: px + 1.0, minZ: 3.0, maxZ: 5.0 });
  });

  // NPC Cikgu Aminah (Guru Bahasa Melayu)
  const teacherGroup = new THREE.Group();
  teacherGroup.position.set(2.0, 0, -3.2);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.52, 0.95, 12), new THREE.MeshLambertMaterial({ color: 0x047857 }));
  skirt.position.y = 0.65;
  teacherGroup.add(skirt);

  const bajuKurung = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.44), new THREE.MeshLambertMaterial({ color: 0x10B981 }));
  bajuKurung.position.y = 1.35;
  teacherGroup.add(bajuKurung);

  const tudung = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), new THREE.MeshLambertMaterial({ color: 0xFEF08A }));
  tudung.position.y = 1.95;
  teacherGroup.add(tudung);
  teacherHead = tudung;

  const face = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.12), new THREE.MeshLambertMaterial({ color: 0xFDE68A }));
  face.position.set(0, 1.9, 0.26);
  teacherGroup.add(face);

  const armL = new THREE.Group();
  armL.position.set(-0.44, 1.55, 0);
  const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), new THREE.MeshLambertMaterial({ color: 0x10B981 }));
  sleeveL.position.y = -0.22;
  armL.add(sleeveL);
  teacherGroup.add(armL);
  teacherWavingArm = armL;

  const teacherTag = createTextSprite('Cikgu Aminah (Guru BM)', 'rgba(6, 78, 59, 0.94)', '#A7F3D0', 512, 160, 52);
  teacherTag.scale.set(3.0, 1.4, 1);
  teacherTag.position.set(0, 2.7, 0);
  teacherGroup.add(teacherTag);

  scene.add(teacherGroup);
  colliders.push({ minX: 1.0, maxX: 3.0, minZ: -4.2, maxZ: -2.2 });
}

// ==========================================
// 6. ROOM 1: TAMAN PAGAR SESAT JAWI (HEDGE MAZE AT 100, 100)
// ==========================================
function buildRoom1() {
  const cx = 100, cz = 100;
  const w = 36, d = 32;
  const hw = w / 2, hd = d / 2; // hw = 18, hd = 16

  // 1. Lush Garden Grass Base
  const baseGeo = new THREE.BoxGeometry(w, 0.4, d);
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x22C55E });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(cx, 0.2, cz);
  baseMesh.receiveShadow = true;
  scene.add(baseMesh);

  // Outer stone rim
  const rimGeo = new THREE.BoxGeometry(w + 0.8, 0.6, d + 0.8);
  const rimMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.set(cx, -0.1, cz);
  scene.add(rimMesh);

  // Topiary Hedge Material
  const hedgeMat = new THREE.MeshLambertMaterial({ color: 0x15803D });

  function addHedge(hx, hz, hwid, hdep) {
    const hMesh = new THREE.Mesh(new THREE.BoxGeometry(hwid, 1.8, hdep), hedgeMat);
    hMesh.position.set(hx, 1.1, hz);
    hMesh.castShadow = true;
    hMesh.receiveShadow = true;
    scene.add(hMesh);
    colliders.push({
      minX: hx - hwid / 2 - 0.2,
      maxX: hx + hwid / 2 + 0.2,
      minZ: hz - hdep / 2 - 0.2,
      maxZ: hz + hdep / 2 + 0.2
    });
  }

  // A. Outer Perimeter Hedges (with entrance gap at South x=86 and exit at North-East x=114)
  // North hedge: cx - hw to cx + hw at z = cz - hd
  addHedge(cx - 2, cz - hd, w - 8, 1.0); // 82 to 110 (opening at 110-118 for exit plaza)
  // South hedge: cx - hw to cx + hw at z = cz + hd (opening at 84-88 for entrance)
  addHedge(82 + (84 - 82)/2, cz + hd, 2, 1.0); // West of opening
  addHedge(cx + 4, cz + hd, w - 8, 1.0);       // East of opening: 88 to 118
  // West hedge: z = 84 to 116 at x = cx - hw
  addHedge(cx - hw, cz, 1.0, d);
  // East hedge: z = 84 to 116 at x = cx + hw
  addHedge(cx + hw, cz, 1.0, d);

  // B. Internal Topiary Maze Walls (Height 1.8 - corridors >= 2.6 wide)
  // Wall 1: Running North from entrance aisle
  addHedge(89.0, 102.0, 0.9, 16.0);
  // Wall 2: Horizontal dividing hedge
  addHedge(95.0, 110.0, 11.0, 0.9);
  // Wall 3: Aisle divider near checkpoint 2 & 3
  addHedge(95.0, 99.0, 0.9, 13.0);
  // Wall 4: East lane hedge
  addHedge(101.0, 105.0, 0.9, 12.0);
  // Wall 5: North lane dividing hedge
  addHedge(104.0, 92.0, 13.0, 0.9);
  // Wall 6: East corridor divider
  addHedge(107.0, 102.0, 0.9, 11.0);
  // Wall 7: Pre-exit hedge
  addHedge(113.0, 102.0, 0.9, 14.0);

  // Stone walkway pavers under paths
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xE2E8F0 });
  const pathGeo = new THREE.PlaneGeometry(2.4, 28);
  const path1 = new THREE.Mesh(pathGeo, stoneMat);
  path1.rotation.x = -Math.PI / 2;
  path1.position.set(86.0, 0.22, 100.0);
  scene.add(path1);

  // Garden Entrance Archway
  const archGroup = new THREE.Group();
  archGroup.position.set(86.0, 0, 115.5);
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x78350F });
  const pL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 0.6), pillarMat);
  pL.position.set(-1.4, 1.6, 0);
  archGroup.add(pL);
  const pR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 0.6), pillarMat);
  pR.position.set(1.4, 1.6, 0);
  archGroup.add(pR);

  const archTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 0.8), pillarMat);
  archTop.position.set(0, 3.2, 0);
  archGroup.add(archTop);

  const signTex = createTextCanvasTexture('TAMAN PAGAR SESAT JAWI', '#065F46', '#FDE68A', 512, 128, 42, 'Kutip 10 Kumpulan Huruf Alif-Ya');
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.9), new THREE.MeshBasicMaterial({ map: signTex }));
  signMesh.position.set(0, 3.2, 0.42);
  archGroup.add(signMesh);
  scene.add(archGroup);

  // End of Maze: "Papan Pintar 37 Huruf Jawi" Station (r1AssemblyStation) at (110.0, 88.0)
  const stationGroup = new THREE.Group();
  stationGroup.position.set(110.0, 0, 88.0);

  // Wooden Kiosk & Smartboard
  const kioskBoard = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x1E293B }));
  kioskBoard.position.set(0, 2.0, 0);
  stationGroup.add(kioskBoard);

  const boardTex = createTextCanvasTexture('PAPAN PINTAR 37 HURUF JAWI', '#064E3B', '#FDE68A', 1024, 512, 48, 'Selesai Maze • Teruskan ke Makmal Kata Jawi');
  const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.0), new THREE.MeshBasicMaterial({ map: boardTex }));
  boardFace.position.set(0, 2.0, 0.11);
  stationGroup.add(boardFace);

  // Kiosk Pillars
  [-1.3, 1.3].forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), new THREE.MeshLambertMaterial({ color: 0x78350F }));
    post.position.set(px, 1.1, 0);
    stationGroup.add(post);
  });

  // Glowing Golden Diamond Beacon on Top
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.4, 0),
    new THREE.MeshStandardMaterial({ color: 0xF59E0B, emissive: 0xF59E0B, emissiveIntensity: 0.9 })
  );
  beacon.position.set(0, 3.4, 0);
  stationGroup.add(beacon);

  const bLight = new THREE.PointLight(0xF59E0B, 1.8, 6);
  bLight.position.set(0, 3.4, 0);
  stationGroup.add(bLight);

  scene.add(stationGroup);
  colliders.push({ minX: 108.5, maxX: 111.5, minZ: 87.0, maxZ: 89.0 });
  r1AssemblyStation = { group: stationGroup, beacon };
}

// ==========================================
// 7. ROOM 2: MAKMAL KATA JAWI (CLASSROOM AT 200, 200)
// ==========================================
function buildRoom2() {
  const cx = 200, cz = 200;
  buildCutawayRoomShell(cx, cz, 0xF8FAFC, 0x0284C7, 0x0369A1, 0x94A3B8);

  // Front Chalkboard
  const boardTex = createTextCanvasTexture(
    'MAKMAL KATA VISUAL JAWI',
    '#065F46',
    '#FFFFFF',
    1024,
    256,
    52,
    'Eja & Padankan 8 Jubin Bergambar Menjadi 4 Pasangan Kata'
  );
  const boardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(14.0, 3.2),
    new THREE.MeshBasicMaterial({ map: boardTex })
  );
  boardMesh.position.set(cx, 3.4, cz - 10.7);
  scene.add(boardMesh);

  // 4 Lab Student Tables
  const tableMat = new THREE.MeshLambertMaterial({ color: 0xF1F5F9 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });

  [
    { x: 194.5, z: 195.0 },
    { x: 205.5, z: 195.0 },
    { x: 194.5, z: 202.0 },
    { x: 205.5, z: 202.0 }
  ].forEach(({ x, z }) => {
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 2.2), tableMat);
    tableTop.position.set(x, 1.0, z);
    tableTop.castShadow = true;
    scene.add(tableTop);

    [[-1.8, -0.8], [1.8, -0.8], [-1.8, 0.8], [1.8, 0.8]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), legMat);
      leg.position.set(x + lx, 0.5, z + lz);
      scene.add(leg);
    });

    colliders.push({ minX: x - 2.2, maxX: x + 2.2, minZ: z - 1.2, maxZ: z + 1.2 });
  });

  // Central Interactive Assembly Station (r2AssemblyStation) at (200.0, 194.5)
  const stationGroup = new THREE.Group();
  stationGroup.position.set(200.0, 0, 194.5);

  const mainDesk = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.05, 1.8), new THREE.MeshLambertMaterial({ color: 0x0284C7 }));
  mainDesk.position.y = 0.52;
  stationGroup.add(mainDesk);

  const deskPad = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 1.4), new THREE.MeshLambertMaterial({ color: 0x38BDF8 }));
  deskPad.position.y = 1.08;
  stationGroup.add(deskPad);

  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.38, 0),
    new THREE.MeshStandardMaterial({ color: 0x06D6A0, emissive: 0x06D6A0, emissiveIntensity: 0.85 })
  );
  beacon.position.set(0, 2.3, 0);
  stationGroup.add(beacon);

  const bLight = new THREE.PointLight(0x06D6A0, 1.6, 5);
  bLight.position.set(0, 2.3, 0);
  stationGroup.add(bLight);

  scene.add(stationGroup);
  colliders.push({ minX: 198.0, maxX: 202.0, minZ: 193.5, maxZ: 195.5 });
  r2AssemblyStation = { group: stationGroup, beacon };
}

// ==========================================
// 8. ROOM 3: ARKIB SIMPULAN BAHASA (LIBRARY AT 300, 300)
// ==========================================
function buildRoom3() {
  const cx = 300, cz = 300;
  buildCutawayRoomShell(cx, cz, 0x451A03, 0x78350F, 0x92400E, 0xD97706);

  // Library Banner
  const libTex = createTextCanvasTexture(
    'ARKIB SIMPULAN BAHASA JAWI',
    '#78350F',
    '#FDE68A',
    1024,
    256,
    50,
    'Pusat Sumber Bestari • Cantumkan 4 Pasangan Kata Menjadi Simpulan Bahasa'
  );
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(14.0, 3.2), new THREE.MeshBasicMaterial({ map: libTex }));
  bannerMesh.position.set(cx, 3.4, cz - 10.7);
  scene.add(bannerMesh);

  // Tall Bookshelves along North Wall
  const shelfMat = new THREE.MeshLambertMaterial({ color: 0x592911 });
  [-8.0, -4.0, 4.0, 8.0].forEach((ox) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.2, 0.9), shelfMat);
    shelf.position.set(cx + ox, 2.3, cz - 10.2);
    shelf.castShadow = true;
    scene.add(shelf);

    // Rows of books inside shelf
    const bookColors = [0xDC2626, 0x2563EB, 0x16A34A, 0xD97706, 0x7C3AED];
    for (let r = 0; r < 3; r++) {
      const bookBlock = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.8, 0.7),
        new THREE.MeshLambertMaterial({ color: bookColors[(r + Math.abs(ox)) % bookColors.length] })
      );
      bookBlock.position.set(cx + ox, 1.2 + r * 1.1, cz - 10.2);
      scene.add(bookBlock);
    }
    colliders.push({ minX: cx + ox - 1.7, maxX: cx + ox + 1.7, minZ: cz - 10.8, maxZ: cz - 9.6 });
  });

  // Cozy Library Carpets
  const rugMat = new THREE.MeshLambertMaterial({ color: 0x991B1B });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 6.0), rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(cx, 0.22, cz);
  scene.add(rug);

  // Central Reading Table Station (r3AssemblyStation) at (300.0, 296.0)
  const stationGroup = new THREE.Group();
  stationGroup.position.set(300.0, 0, 296.0);

  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 2.4), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  tableTop.position.y = 1.0;
  tableTop.castShadow = true;
  stationGroup.add(tableTop);

  // Open illuminated book on table
  const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.6), new THREE.MeshStandardMaterial({ color: 0xFFFDF0 }));
  bookMesh.position.set(0, 1.12, 0);
  stationGroup.add(bookMesh);

  // Brass Banker's Lamp
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 8), new THREE.MeshStandardMaterial({ color: 0x15803D, metalness: 0.6 }));
  lamp.position.set(1.4, 1.3, 0);
  stationGroup.add(lamp);

  // Beacon on table
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.38, 0),
    new THREE.MeshStandardMaterial({ color: 0x8B5CF6, emissive: 0x8B5CF6, emissiveIntensity: 0.85 })
  );
  beacon.position.set(0, 2.3, 0);
  stationGroup.add(beacon);

  const bLight = new THREE.PointLight(0x8B5CF6, 1.6, 5);
  bLight.position.set(0, 2.3, 0);
  stationGroup.add(bLight);

  scene.add(stationGroup);
  colliders.push({ minX: 297.8, maxX: 302.2, minZ: 294.6, maxZ: 297.4 });
  r3AssemblyStation = { group: stationGroup, beacon };
}

// ==========================================
// 9. ROOM 4: STUDIO PERSEMBAHAN SENI KHAT (ART STUDIO AT 400, 400 - SP 4.4.2)
// ==========================================
function buildRoom4() {
  const cx = 400, cz = 400;
  buildCutawayRoomShell(cx, cz, 0xB45309, 0xF8FAFC, 0xF1F5F9, 0x78350F);

  // Studio Banner
  const artTex = createTextCanvasTexture(
    'STUDIO PERSEMBAHAN SENI KHAT JAWI',
    '#9A3412',
    '#FEF3C7',
    1024,
    256,
    48,
    'Standard Pembelajaran 4.4.2 • Mempersembahkan Keindahan Seni Tulisan Jawi'
  );
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(14.0, 3.2), new THREE.MeshBasicMaterial({ map: artTex }));
  bannerMesh.position.set(cx, 3.4, cz - 10.7);
  scene.add(bannerMesh);

  // Paint Splatter Decals on North & West Walls
  const splatterCanvas = document.createElement('canvas');
  splatterCanvas.width = 512;
  splatterCanvas.height = 512;
  const sCtx = splatterCanvas.getContext('2d');
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  for (let i = 0; i < 40; i++) {
    sCtx.fillStyle = colors[i % colors.length];
    sCtx.beginPath();
    const sx = Math.random() * 512, sy = Math.random() * 512, sr = 6 + Math.random() * 22;
    sCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    sCtx.fill();
  }
  const splatterTex = new THREE.CanvasTexture(splatterCanvas);

  const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 3.0), new THREE.MeshBasicMaterial({ map: splatterTex, transparent: true, opacity: 0.65 }));
  decalMesh.position.set(cx - 5.0, 2.5, cz - 10.65);
  scene.add(decalMesh);

  // 4 Wooden Standing Art Easels around Studio
  const easelMat = new THREE.MeshLambertMaterial({ color: 0x92400E });
  [
    { x: 393.5, z: 393.5, title: 'Khat Ulat Buku' },
    { x: 406.5, z: 393.5, title: 'Khat Anak Emas' },
    { x: 393.5, z: 404.0, title: 'Khat Buah Hati' },
    { x: 406.5, z: 404.0, title: 'Khat Cahaya Mata' }
  ].forEach(({ x, z, title }) => {
    const easelGroup = new THREE.Group();
    easelGroup.position.set(x, 0, z);

    // Tripod Legs
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 6), easelMat);
    leg1.position.set(-0.4, 1.25, 0.2);
    leg1.rotation.z = 0.15;
    easelGroup.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 6), easelMat);
    leg2.position.set(0.4, 1.25, 0.2);
    leg2.rotation.z = -0.15;
    easelGroup.add(leg2);

    const leg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.5, 6), easelMat);
    leg3.position.set(0, 1.25, -0.4);
    leg3.rotation.x = -0.22;
    easelGroup.add(leg3);

    // Small Sample Framed Artwork
    const sampleTex = createTextCanvasTexture(title, '#1E293B', '#FDE68A', 512, 384, 44);
    const canvasSample = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ map: sampleTex }));
    canvasSample.position.set(0, 1.45, 0.18);
    easelGroup.add(canvasSample);

    scene.add(easelGroup);
    colliders.push({ minX: x - 0.9, maxX: x + 0.9, minZ: z - 0.9, maxZ: z + 0.9 });
  });

  // Central Masterpiece Assembly Station (r4AssemblyStation) at (400.0, 395.5)
  const stationGroup = new THREE.Group();
  stationGroup.position.set(400.0, 0, 395.5);

  // Large Standing Masterpiece Easel
  const mainEaselLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8), easelMat);
  mainEaselLegL.position.set(-0.9, 1.6, 0.3);
  mainEaselLegL.rotation.z = 0.18;
  stationGroup.add(mainEaselLegL);

  const mainEaselLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8), easelMat);
  mainEaselLegR.position.set(0.9, 1.6, 0.3);
  mainEaselLegR.rotation.z = -0.18;
  stationGroup.add(mainEaselLegR);

  const mainEaselBack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.3, 8), easelMat);
  mainEaselBack.position.set(0, 1.6, -0.6);
  mainEaselBack.rotation.x = -0.25;
  stationGroup.add(mainEaselBack);

  // Big Masterpiece Canvas (Dynamically Updated by updateMasterpieceEaselTexture)
  const defaultMasterpieceTex = createTextCanvasTexture(
    'KANVAS PAMERAN UTAMA',
    '#FFFBEB',
    '#9A3412',
    1024,
    768,
    64,
    'Tekan E untuk Melukis & Menghias Seni Simpulan Bahasa'
  );
  const mCanvasMat = new THREE.MeshBasicMaterial({ map: defaultMasterpieceTex });
  masterpieceCanvasMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.7, 0.08), mCanvasMat);
  masterpieceCanvasMesh.position.set(0, 1.85, 0.22);
  stationGroup.add(masterpieceCanvasMesh);

  // Gold Frame around Canvas
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.25 });
  const frameBorder = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.85, 0.06), frameMat);
  frameBorder.position.set(0, 1.85, 0.2);
  stationGroup.add(frameBorder);

  // Spinning Beacon
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    new THREE.MeshStandardMaterial({ color: 0xF59E0B, emissive: 0xF59E0B, emissiveIntensity: 0.9 })
  );
  beacon.position.set(0, 3.2, 0);
  stationGroup.add(beacon);

  const bLight = new THREE.PointLight(0xF59E0B, 2.0, 6);
  bLight.position.set(0, 3.2, 0);
  stationGroup.add(bLight);

  scene.add(stationGroup);
  colliders.push({ minX: 398.2, maxX: 401.8, minZ: 394.2, maxZ: 396.8 });
  r4AssemblyStation = { group: stationGroup, beacon };
}

// ==========================================
// 10. PORTAL CREATION & CONNECTIONS
// ==========================================
const portalPedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.35, 24);
const portalCoreGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.2, 16, 1, true);
const portalHaloGeo = new THREE.TorusGeometry(1.3, 0.08, 12, 32);
const portals = {};

function createPortal(key, px, pz, colorHex, emitHex) {
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

  scene.add(pGroup);
  colliders.push({ minX: px - 1.2, maxX: px + 1.2, minZ: pz - 1.2, maxZ: pz + 1.2 });

  portals[key] = { group: pGroup, core, halo, light };
  return portals[key];
}

// 1. Lobby Portal -> Teleports to Room 1
createPortal('portalR1', 4.5, 2.0, 0x06D6A0, 0x05B386);

// 2. Room 1 Exit Portal -> Teleports to Room 2
createPortal('portalR2', 114.5, 88.0, 0x3B82F6, 0x2563EB);

// 3. Room 2 Exit Portal -> Teleports to Room 3
createPortal('portalR3', 206.5, 194.0, 0x10B981, 0x059669);

// 4. Room 3 Exit Portal -> Teleports to Room 4
createPortal('portalR4', 306.5, 294.0, 0xF59E0B, 0xD97706);

// 5. Room 4 Return Portal -> Teleports back to Lobby
createPortal('returnLobby', 406.5, 394.0, 0x8B5CF6, 0x7C3AED);

// ==========================================
// 11. COLLECTIBLE SPAWNER
// ==========================================
function setupCollectiblesList(items, geomType = 'crystal') {
  const group = new THREE.Group();
  scene.add(group);

  items.forEach((item) => {
    const itemGroup = new THREE.Group();
    itemGroup.position.set(item.pos.x, item.pos.y, item.pos.z);

    let mainMesh;

    if (geomType === 'jawi_checkpoint') {
      // Room 1: 3D Jawi Checkpoint Tablet on Stone Plinth
      const cGroup = new THREE.Group();

      const plinthMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 16), plinthMat);
      plinth.position.y = -0.55;
      cGroup.add(plinth);

      const hexColor = '#' + item.color.toString(16).padStart(6, '0');
      const tileTex = createJawiTileTexture(item.char, item.name, hexColor);
      const faceMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.25 });
      const sideMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.7, roughness: 0.3 });
      const tileMats = [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat];

      const tablet = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.22), tileMats);
      cGroup.add(tablet);

      // Gold outer frame
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.8 });
      const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.18, 0.16), frameMat);
      tablet.add(frameMesh);

      // Floating sprite label directly above
      const labelSprite = createTextSprite(
        `${item.char}`,
        'rgba(15, 23, 42, 0.94)',
        '#FDE68A',
        512,
        180,
        64
      );
      labelSprite.scale.set(3.4, 1.6, 1);
      labelSprite.position.set(0, 1.55, 0);
      cGroup.add(labelSprite);

      mainMesh = cGroup;
    } else if (geomType === 'picture_card') {
      // Room 2: Illustrated Picture & Word Tile (createIllustratedCardTexture)
      const cardGroup = new THREE.Group();
      const cardTex = createIllustratedCardTexture(item);

      const sideMat = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.6, roughness: 0.35 });
      const faceMat = new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.25 });
      const tileMats = [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat];

      const cardMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.25, 0.16), tileMats);
      cardGroup.add(cardMesh);

      // Gold frame rim
      const frameRim = new THREE.Mesh(
        new THREE.BoxGeometry(1.08, 1.33, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.8 })
      );
      cardMesh.add(frameRim);

      // Floating sprite label above card
      const cardTag = createTextSprite(
        `${item.char} ${item.rumi} (${item.jawi})`,
        'rgba(15, 23, 42, 0.94)',
        '#67E8F9',
        512,
        180,
        56
      );
      cardTag.scale.set(3.4, 1.6, 1);
      cardTag.position.set(0, 1.7, 0);
      cardGroup.add(cardTag);

      mainMesh = cardGroup;
    } else if (geomType === 'scroll') {
      // Room 3: 3D Rolled Parchment Scroll
      const scrollGroup = new THREE.Group();

      const parchmentMat = new THREE.MeshStandardMaterial({ color: 0xFFFBEB, roughness: 0.5 });
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.4 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.2 });

      // Parchment cylinder roll
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.05, 16), parchmentMat);
      scrollGroup.add(roll);

      // Spindle Rods extending on left & right
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.45, 12), woodMat);
      scrollGroup.add(rod);

      // Gold End Finials
      [-0.72, 0.72].forEach((fy) => {
        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), goldMat);
        finial.position.y = fy;
        scrollGroup.add(finial);
      });

      // Red silk tie ribbon
      const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16), new THREE.MeshLambertMaterial({ color: 0xDC2626 }));
      scrollGroup.add(ribbon);

      scrollGroup.rotation.z = Math.PI / 2.5;

      // Floating sprite label
      const scrollTag = createTextSprite(
        `📜 ${item.label} (${item.jawi})`,
        'rgba(15, 23, 42, 0.94)',
        '#FDE047',
        512,
        180,
        52
      );
      scrollTag.scale.set(3.6, 1.6, 1);
      scrollTag.position.set(0, 1.6, 0);
      itemGroup.add(scrollTag);

      mainMesh = scrollGroup;
    } else {
      // Room 4: 3D Art Studio Supplies (geomType === 'art_tool')
      const supplyGroup = new THREE.Group();

      if (item.id === 'tool_berus') {
        // Berus Khat (Bamboo Calligraphy Brush)
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.25, 8), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
        supplyGroup.add(stem);

        const ferrule = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8),
          new THREE.MeshStandardMaterial({ color: 0xFCD34D, metalness: 0.85, roughness: 0.2 })
        );
        ferrule.position.y = 0.62;
        supplyGroup.add(ferrule);

        const tip = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 0.42, 12),
          new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.5 })
        );
        tip.position.y = 0.92;
        supplyGroup.add(tip);

        supplyGroup.rotation.z = Math.PI / 4;
      } else if (item.id === 'tool_dakwat') {
        // Dakwat Emas (Ink Pot with glowing gold pigment)
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.55, 12), new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.3 }));
        supplyGroup.add(pot);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0x334155 }));
        neck.position.y = 0.35;
        supplyGroup.add(neck);

        const stopper = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 12, 10),
          new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.2 })
        );
        stopper.position.y = 0.48;
        supplyGroup.add(stopper);
      } else {
        // Bingkai Ukir (Traditional Carved Wooden Frame)
        const frameMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 1.25, 0.08),
          new THREE.MeshLambertMaterial({ color: 0x78350F })
        );
        supplyGroup.add(frameMesh);

        const innerMat = new THREE.MeshStandardMaterial({ color: 0xFFFDF0, roughness: 0.4 });
        const inner = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.08), innerMat);
        inner.position.z = 0.045;
        supplyGroup.add(inner);

        const goldBorder = new THREE.Mesh(
          new THREE.BoxGeometry(0.86, 1.14, 0.04),
          new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.75 })
        );
        goldBorder.position.z = 0.03;
        supplyGroup.add(goldBorder);
      }

      supplyGroup.scale.set(1.4, 1.4, 1.4);
      mainMesh = supplyGroup;

      const toolTag = createTextSprite(
        `${item.char} ${item.name}`,
        'rgba(15, 23, 42, 0.94)',
        '#FDE047',
        512,
        180,
        56
      );
      toolTag.scale.set(3.4, 1.6, 1);
      toolTag.position.set(0, 1.7, 0);
      itemGroup.add(toolTag);
    }

    mainMesh.castShadow = true;
    itemGroup.add(mainMesh);

    // Glowing base ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.065, 8, 24),
      new THREE.MeshStandardMaterial({ color: item.color, emissive: item.color, emissiveIntensity: 0.85 })
    );
    ring.rotation.x = Math.PI / 2;
    itemGroup.add(ring);

    // Glowing point light
    const light = new THREE.PointLight(item.color, 1.5, 5);
    itemGroup.add(light);

    item.mesh = itemGroup;
    item.gemMesh = mainMesh;
    item.ringMesh = ring;
    item.pointLight = light;
    item.isPopping = false;
    item.popScale = 1.0;

    group.add(itemGroup);
  });
}

// Initialize collectibles across all 4 rooms
setupCollectiblesList(COLLECTIBLES_R1, 'jawi_checkpoint');
setupCollectiblesList(COLLECTIBLES_R2, 'picture_card');
setupCollectiblesList(COLLECTIBLES_R3, 'scroll');
setupCollectiblesList(COLLECTIBLES_R4, 'art_tool');

// ==========================================
// 12. 3D PLAYER AVATAR SETUP (ANIMATED MALAYSIAN PRIMARY SCHOOL STUDENT)
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
// 12.5 DYNAMIC 3D FLOOR GUIDE ARROW (ANAK PANAH PANDUAN)
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
// 13. TELEPORTATION SYSTEM
// ==========================================
export function teleportTo(roomId) {
  const targetRoom = ROOM_CONFIG[roomId];
  if (!targetRoom) return;

  playTeleportSfx();
  gameState.currentRoom = roomId;

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
    updateMissionText('Misi: Cari 8 jubin bergambar di Makmal Kata & eja perkataan Jawi di Meja Interaktif.');
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
// 14. COLLISION DETECTION
// ==========================================
function checkWallCollision(nextX, nextZ) {
  const safe = PLAYER_RADIUS;
  const room = ROOM_CONFIG[gameState.currentRoom] || ROOM_CONFIG.lobby;
  const { minX, maxX, minZ, maxZ } = room.bounds;

  // Platform perimeter boundary check
  if (nextX < minX + safe || nextX > maxX - safe) return true;
  if (nextZ < minZ + safe || nextZ > maxZ - safe) return true;

  // Registered obstacle boxes
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
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
// 15. INPUT HANDLING
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
// 16. GAME LOOP & ANIMATION
// ==========================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Portal Animations
  Object.values(portals).forEach(({ core, halo, light }, idx) => {
    core.rotation.y += 1.8 * delta;
    halo.rotation.z += 1.2 * delta;
    const bob = Math.sin(time * 3.0 + idx) * 0.14;
    core.position.y = 1.4 + bob;
    halo.position.y = 1.4 + bob;
    light.intensity = 1.5 + Math.sin(time * 4.0 + idx) * 0.35;
  });

  // Assembly Station Beacon Animations
  if (r1AssemblyStation) {
    r1AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r1AssemblyStation.beacon.position.y = 3.4 + Math.sin(time * 2.8) * 0.12;
  }
  if (r2AssemblyStation) {
    r2AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r2AssemblyStation.beacon.position.y = 2.3 + Math.sin(time * 2.8) * 0.12;
  }
  if (r3AssemblyStation) {
    r3AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r3AssemblyStation.beacon.position.y = 2.3 + Math.sin(time * 2.8) * 0.12;
  }
  if (r4AssemblyStation) {
    r4AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r4AssemblyStation.beacon.position.y = 3.2 + Math.sin(time * 2.8) * 0.12;
  }

  // Teacher NPC Gentle Idle Waving
  if (teacherWavingArm) {
    teacherWavingArm.rotation.z = Math.sin(time * 3.2) * 0.28 + 0.45;
    teacherWavingArm.rotation.x = Math.cos(time * 3.2) * 0.15;
  }
  if (teacherHead) {
    teacherHead.rotation.y = Math.sin(time * 1.6) * 0.12;
  }

  // Active Collectibles Loop (Based on current active room)
  let activeCollectibles = [];
  if (gameState.currentRoom === 'room1') activeCollectibles = COLLECTIBLES_R1;
  else if (gameState.currentRoom === 'room2') activeCollectibles = COLLECTIBLES_R2;
  else if (gameState.currentRoom === 'room3') activeCollectibles = COLLECTIBLES_R3;
  else if (gameState.currentRoom === 'room4') activeCollectibles = COLLECTIBLES_R4;

  // For Room 1: Find sequential active checkpoint index (0 to 9)
  const activeR1Index = COLLECTIBLES_R1.findIndex(it => !it.collected);

  activeCollectibles.forEach((item, index) => {
    if (!item.collected && item.mesh) {
      item.gemMesh.rotation.y += 1.8 * delta;
      item.ringMesh.rotation.z += 1.5 * delta;
      const bob = Math.sin(time * 3.0 + index) * 0.14;
      item.mesh.position.y = item.pos.y + bob;

      // Sequential Pickup Check for Room 1
      if (gameState.currentRoom === 'room1') {
        const isCurrentActive = (index === activeR1Index);
        if (isCurrentActive) {
          // Highlight active checkpoint with bright gold beacon pulse
          item.ringMesh.material.color.setHex(0xF59E0B);
          item.ringMesh.material.emissive.setHex(0xF59E0B);
          item.ringMesh.material.emissiveIntensity = 1.0 + Math.sin(time * 6.0) * 0.4;
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
          item.ringMesh.material.color.setHex(0x64748B);
          item.ringMesh.material.emissive.setHex(0x334155);
          item.ringMesh.material.emissiveIntensity = 0.3;
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

  // Player Movement (Roblox 3rd-Person Front View Axes)
  if (!gameState.activeModal) {
    let inputX = 0;
    let inputZ = 0;

    if (keys.w || keys.ArrowUp) { inputZ -= 1; }
    if (keys.s || keys.ArrowDown) { inputZ += 1; }
    if (keys.a || keys.ArrowLeft) { inputX -= 1; }
    if (keys.d || keys.ArrowRight) { inputX += 1; }

    if (inputX !== 0 || inputZ !== 0) {
      const length = Math.hypot(inputX, inputZ);
      const moveX = (inputX / length) * PLAYER_SPEED;
      const moveZ = (inputZ / length) * PLAYER_SPEED;

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
      const uncollected = COLLECTIBLES_R2.filter(item => !item.collected);
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
    if (dTeacher <= 2.6) {
      foundTarget = 'npcTeacher';
      promptText = 'Tekan E untuk Bicara dengan Cikgu Aminah';
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

// Build all rooms on startup
buildLobby();
buildRoom1();
buildRoom2();
buildRoom3();
buildRoom4();

// Initialize dynamic HUD
updateInventoryHUD();

// Start Game Loop
animate();
