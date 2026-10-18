// ==========================================
// GAME.JS - Three.js Campus Engine, Diorama Architecture & Loop
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
  COLLECTIBLES_R3
} from './state.js';

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
  closeModal
} from './ui.js';

// ==========================================
// 1. THREE.JS SCENE & ROBLOX 3RD-PERSON SETUP
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xBAE6FD);
scene.fog = new THREE.FogExp2(0xBAE6FD, 0.006);

// Roblox 3rd-Person PerspectiveCamera (Close-Up & Immersive)
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 4.2, 12.0);
camera.lookAt(0, 1.4, 4.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Infinite-looking green grass ground plane (800x800) under all rooms
const grassMat = new THREE.MeshLambertMaterial({ color: 0x4ADE80 });
const groundGeo = new THREE.PlaneGeometry(800, 800);
const groundMesh = new THREE.Mesh(groundGeo, grassMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.25;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// ==========================================
// 2. LIGHTING SETUP
// ==========================================
const ambientLight = new THREE.AmbientLight(0xFFF9F0, 0.75);
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
  ctx.lineWidth = 8;
  ctx.stroke();

  // Text with bold font
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px "Fredoka", "Plus Jakarta Sans", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(3.2, 1.6, 1);
  return sprite;
}

export function createJawiTileTexture(char, name, colorHex = '#2563EB') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Background Parchment Cream
  ctx.fillStyle = '#FFFDF5';
  ctx.fillRect(0, 0, 512, 512);

  // Outer Gold Decorative Border
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 18;
  ctx.strokeRect(12, 12, 488, 488);

  // Inner Accent Border in item color
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 30, 452, 452);

  // Decorative Corner Dots
  ctx.fillStyle = '#F59E0B';
  [[48, 48], [464, 48], [48, 464], [464, 464]].forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.fill();
  });

  // Large Jawi Character in Center
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 220px "Amiri", "Traditional Arabic", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 256, 215);

  // Rumi Name Badge below (e.g. "GA")
  ctx.fillStyle = colorHex;
  ctx.font = 'bold 50px "Fredoka", "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(name.toUpperCase(), 256, 400);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// Global animated teacher references
let teacherWavingArm = null;
let teacherHead = null;

// ==========================================
// 3. FULL-ROOM ARCHITECTURE (26 x 22 units, 5.0m Height)
// ==========================================
// 3 full-height walls (North -Z, West -X, East +X at height: 5.0)
// South (+Z) wall behind camera is a low curb (0.25) so camera view is completely open!
function buildCutawayRoomShell(cx, cz, floorColor, northWallColor, westWallColor, trimColor = 0xA0AEC0) {
  const halfX = 13; // 26 wide
  const halfZ = 11; // 22 deep
  const fullH = 5.0;
  const curbH = 0.25;
  const thick = 0.8;

  // 1. Floor (26 x 22)
  const floorGeo = new THREE.BoxGeometry(26, 0.4, 22);
  const floorMat = new THREE.MeshLambertMaterial({ color: floorColor });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(cx, -0.2, cz);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Helper for wall segments with baseboard and crown molding
  function addWallMesh(wx, wz, wWidth, wDepth, wHeight, color) {
    const wallGeo = new THREE.BoxGeometry(wWidth, wHeight, wDepth);
    const wallMat = new THREE.MeshLambertMaterial({ color });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(wx, wHeight / 2, wz);
    wall.castShadow = (wHeight > 1.0);
    wall.receiveShadow = true;
    scene.add(wall);

    if (wHeight > 1.0) {
      // Baseboard trim along bottom
      const trimGeo = new THREE.BoxGeometry(wWidth + 0.05, 0.35, wDepth + 0.05);
      const trimMat = new THREE.MeshLambertMaterial({ color: trimColor });
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.position.set(wx, 0.175, wz);
      scene.add(trim);

      // Crown molding along top
      const crownGeo = new THREE.BoxGeometry(wWidth + 0.05, 0.22, wDepth + 0.05);
      const crown = new THREE.Mesh(crownGeo, trimMat);
      crown.position.set(wx, wHeight - 0.11, wz);
      scene.add(crown);
    }
  }

  // 1. North Wall (-Z): Full Height 5.0 Backdrop (26 wide)
  addWallMesh(cx, cz - halfZ - thick / 2, 26 + thick * 2, thick, fullH, northWallColor);

  // 2. West Wall (-X): Full Height 5.0 Backdrop (22 deep)
  addWallMesh(cx - halfX - thick / 2, cz, thick, 22, fullH, westWallColor);

  // 3. East Wall (+X): Full Height 5.0 Backdrop (22 deep)
  addWallMesh(cx + halfX + thick / 2, cz, thick, 22, fullH, westWallColor);

  // 4. South Wall (+Z): Low Protective Curb (0.25) behind camera so camera never clips!
  addWallMesh(cx, cz + halfZ + thick / 2, 26 + thick * 2, thick, curbH, trimColor);

  // Large High Windows on West & East Walls letting daylight into the room
  const winFrameMat = new THREE.MeshLambertMaterial({ color: 0xF8FAFC });
  const winGlassMat = new THREE.MeshLambertMaterial({ color: 0xBAE6FD, transparent: true, opacity: 0.75 });
  [-4.5, 4.5].forEach((wzOffset) => {
    // West Window (-X)
    const wFrameW = new THREE.Mesh(new THREE.BoxGeometry(thick + 0.1, 2.2, 3.2), winFrameMat);
    wFrameW.position.set(cx - halfX - thick / 2, 3.2, cz + wzOffset);
    scene.add(wFrameW);

    const wGlassW = new THREE.Mesh(new THREE.BoxGeometry(thick + 0.12, 1.9, 2.9), winGlassMat);
    wGlassW.position.set(cx - halfX - thick / 2, 3.2, cz + wzOffset);
    scene.add(wGlassW);

    // East Window (+X)
    const wFrameE = new THREE.Mesh(new THREE.BoxGeometry(thick + 0.1, 2.2, 3.2), winFrameMat);
    wFrameE.position.set(cx + halfX + thick / 2, 3.2, cz + wzOffset);
    scene.add(wFrameE);

    const wGlassE = new THREE.Mesh(new THREE.BoxGeometry(thick + 0.12, 1.9, 2.9), winGlassMat);
    wGlassE.position.set(cx + halfX + thick / 2, 3.2, cz + wzOffset);
    scene.add(wGlassE);
  });
}

// ==========================================
// 4. LOBBY: DATARAN SEKOLAH (x: 0, z: 0 - Dataran Perhimpunan)
// ==========================================
function buildLobby() {
  const { center } = ROOM_CONFIG.lobby;
  const cx = center.x;
  const cz = center.z;

  // Floor & Cutaway walls
  buildCutawayRoomShell(cx, cz, 0xE5E0D8, 0xD4C5B9, 0xC8B9AD, 0x8C7A6B);

  // Courtyard Tile Grid
  const grid = new THREE.GridHelper(22, 11, 0xC4B5A5, 0xD9CFC4);
  grid.position.set(cx, 0.02, cz);
  scene.add(grid);

  // 1. Red Carpet & Stone Paved Pathways
  // Ceremonial Red Carpet running from spawn towards the center stage
  const carpetMat = new THREE.MeshLambertMaterial({ color: 0x991B1B });
  const carpetMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.025, 10.5), carpetMat);
  carpetMesh.position.set(cx, 0.015, cz + 0.5);
  carpetMesh.receiveShadow = true;
  scene.add(carpetMesh);

  // Golden carpet borders
  const goldBorderMat = new THREE.MeshLambertMaterial({ color: 0xF59E0B });
  [-1.25, 1.25].forEach(bx => {
    const border = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.026, 10.5), goldBorderMat);
    border.position.set(cx + bx, 0.016, cz + 0.5);
    scene.add(border);
  });

  // Stone Pathway to Portal (branching towards x: 4.5, z: 2.0)
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xCBD5E1 });
  for (let step = 0; step < 4; step++) {
    const pStone = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.022, 0.9), stoneMat);
    pStone.position.set(cx + 1.6 + step * 0.95, 0.014, cz + 2.0);
    pStone.receiveShadow = true;
    scene.add(pStone);
  }

  // Stone Pathway towards Flagpole Stage (branching towards x: -4.5, z: -4.5)
  for (let step = 0; step < 4; step++) {
    const pStone = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.022, 0.9), stoneMat);
    pStone.position.set(cx - 1.5 - step * 0.8, 0.014, cz - 1.5 - step * 0.8);
    pStone.receiveShadow = true;
    scene.add(pStone);
  }

  // 2. School Signboard Arch on North Wall (-Z) with Real Readable CanvasTexture
  const signWidth = 11.2;
  const signHeight = 1.35;
  const signTex = createTextCanvasTexture(
    'SK BESTARI - KEMBARA BAHASA',
    '#1E3A8A',
    '#FFFFFF',
    1024,
    200,
    54,
    'INISIATIF MODEL PEMBELAJARAN TRIALOGIKAL'
  );

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(signWidth, signHeight, 0.25),
    new THREE.MeshLambertMaterial({ color: 0x1E3A8A })
  );
  signMesh.position.set(cx, 2.75, cz - 10.85);
  scene.add(signMesh);

  // Front Decal Plaque with CanvasTexture
  const plaqueMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(signWidth - 0.2, signHeight - 0.1), plaqueMat);
  plaque.position.set(cx, 2.75, cz - 10.71);
  scene.add(plaque);

  // Golden architectural trims on signboard
  const topGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(signWidth + 0.4, 0.14, 0.3), goldBorderMat);
  topGoldTrim.position.set(cx, 3.45, cz - 10.85);
  scene.add(topGoldTrim);

  const bottomGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(signWidth + 0.4, 0.1, 0.3), goldBorderMat);
  bottomGoldTrim.position.set(cx, 2.05, cz - 10.85);
  scene.add(bottomGoldTrim);

  // Brick Support Pillars for School Arch
  [-5.8, 5.8].forEach(px => {
    const colMat = new THREE.MeshLambertMaterial({ color: 0xB45309 });
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.8, 0.85), colMat);
    col.position.set(cx + px, 1.9, cz - 10.6);
    col.castShadow = true;
    scene.add(col);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.2, 1.05), goldBorderMat);
    cap.position.set(cx + px, 3.85, cz - 10.6);
    scene.add(cap);

    colliders.push({ minX: cx + px - 0.5, maxX: cx + px + 0.5, minZ: cz - 11.0, maxZ: cz - 10.1 });
  });

  // 3. Wooden Glass Noticeboard (Papan Kenyataan) on West Wall (-X)
  const nbGroup = new THREE.Group();
  nbGroup.position.set(cx - 12.85, 2.1, cz);

  // Frame & Corkboard
  const nbFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.3, 5.6), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  nbFrame.castShadow = true;
  nbGroup.add(nbFrame);

  const nbCork = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.05, 5.3), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
  nbCork.position.set(0.08, 0, 0);
  nbGroup.add(nbCork);

  // Title Banner at top of Noticeboard
  const nbTitleTex = createTextCanvasTexture('PAPAN KENYATAAN SEKOLAH', '#1E40AF', '#FFFFFF', 512, 90, 36);
  const nbTitlePlaque = new THREE.Mesh(
    new THREE.PlaneGeometry(5.1, 0.4),
    new THREE.MeshBasicMaterial({ map: nbTitleTex, transparent: true })
  );
  nbTitlePlaque.rotation.y = Math.PI / 2;
  nbTitlePlaque.position.set(0.11, 0.8, 0);
  nbGroup.add(nbTitlePlaque);

  // 6 Colorful Motivational Paper Posters (2 rows of 3)
  const posterConfigs = [
    { color: 0xEF4444, title: 'Membaca', z: -1.7, y: 0.25 },
    { color: 0x3B82F6, title: 'Bahasa', z: 0.0, y: 0.25 },
    { color: 0x10B981, title: 'Bestari', z: 1.7, y: 0.25 },
    { color: 0xF59E0B, title: 'Jawi', z: -1.7, y: -0.45 },
    { color: 0x8B5CF6, title: 'Trialogikal', z: 0.0, y: -0.45 },
    { color: 0x06B6D4, title: 'Nilam', z: 1.7, y: -0.45 }
  ];

  posterConfigs.forEach(p => {
    // Paper rectangle
    const pMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.55, 1.3),
      new THREE.MeshLambertMaterial({ color: p.color })
    );
    pMesh.position.set(0.11, p.y, p.z);
    nbGroup.add(pMesh);

    // Decorative inner white lines (mock text on posters)
    for (let li = 0; li < 3; li++) {
      const lineMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.04, 1.0),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      );
      lineMesh.position.set(0.13, p.y - 0.08 + li * 0.1, p.z);
      nbGroup.add(lineMesh);
    }

    // Gold push-pin
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), goldBorderMat);
    pin.position.set(0.13, p.y + 0.23, p.z);
    nbGroup.add(pin);
  });

  scene.add(nbGroup);
  colliders.push({ minX: cx - 13.0, maxX: cx - 12.5, minZ: cz - 3.0, maxZ: cz + 3.0 });

  // 4. Tropical Flower Beds along North and West Wall Bases
  function createFlowerBed(bx, bz, bWidth, bDepth) {
    const fGroup = new THREE.Group();
    fGroup.position.set(cx + bx, 0, cz + bz);

    // Raised brick planter box
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(bWidth, 0.45, bDepth),
      new THREE.MeshLambertMaterial({ color: 0xB45309 })
    );
    curb.position.y = 0.225;
    curb.castShadow = true;
    fGroup.add(curb);

    // Rich dark soil
    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(bWidth - 0.2, 0.05, bDepth - 0.2),
      new THREE.MeshLambertMaterial({ color: 0x3E2723 })
    );
    soil.position.y = 0.43;
    fGroup.add(soil);

    // Bushes and flowers along the planter box
    const numFlowers = Math.max(3, Math.floor(Math.max(bWidth, bDepth) * 1.8));
    const flowerColors = [0xEF4444, 0xFBBF24, 0xA855F7, 0xF8FAFC, 0xEC4899];
    const isHorizontal = bWidth >= bDepth;

    for (let i = 0; i < numFlowers; i++) {
      const t = (i / (numFlowers - 1)) - 0.5;
      const fx = isHorizontal ? t * (bWidth - 0.6) : (Math.random() - 0.5) * 0.2;
      const fz = isHorizontal ? (Math.random() - 0.5) * 0.2 : t * (bDepth - 0.6);

      // Low-poly foliage clump
      const bush = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.22 + Math.random() * 0.06),
        new THREE.MeshLambertMaterial({ color: (i % 2 === 0) ? 0x15803D : 0x16A34A })
      );
      bush.position.set(fx, 0.52, fz);
      bush.castShadow = true;
      fGroup.add(bush);

      // Flower blossom on top
      const blossom = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 6, 6),
        new THREE.MeshLambertMaterial({ color: flowerColors[i % flowerColors.length] })
      );
      blossom.position.set(fx, 0.72 + Math.random() * 0.08, fz);
      fGroup.add(blossom);
    }

    scene.add(fGroup);
    colliders.push({
      minX: cx + bx - bWidth / 2 - 0.1,
      maxX: cx + bx + bWidth / 2 + 0.1,
      minZ: cz + bz - bDepth / 2 - 0.1,
      maxZ: cz + bz + bDepth / 2 + 0.1
    });
  }

  // Add Flower Beds along North wall (-Z)
  createFlowerBed(-2.8, -10.35, 4.8, 0.9);
  createFlowerBed(2.8, -10.35, 4.8, 0.9);

  // Add Flower Beds along West wall (-X) flanking noticeboard
  createFlowerBed(-12.35, -6.5, 0.9, 4.6);
  createFlowerBed(-12.35, 6.2, 0.9, 4.6);

  // 5. Flagpole on tiered pedestal
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.25, 16), new THREE.MeshLambertMaterial({ color: 0xCBD5E1 }));
  base1.position.set(cx - 4.5, 0.125, cz - 4.5);
  base1.receiveShadow = true;
  scene.add(base1);

  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.25, 16), new THREE.MeshLambertMaterial({ color: 0x94A3B8 }));
  base2.position.set(cx - 4.5, 0.375, cz - 4.5);
  scene.add(base2);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.5, 10), new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.8 }));
  pole.position.set(cx - 4.5, 3.0, cz - 4.5);
  pole.castShadow = true;
  scene.add(pole);

  // School Flag Mesh
  const flagGeo = new THREE.BoxGeometry(1.4, 0.9, 0.04);
  const flagMat = new THREE.MeshLambertMaterial({ color: 0xEF4444 });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(cx - 3.7, 5.0, cz - 4.5);
  flag.castShadow = true;
  scene.add(flag);

  colliders.push({ minX: cx - 6.2, maxX: cx - 2.8, minZ: cz - 6.2, maxZ: cz - 2.8 });

  // 6. Wooden Courtyard Benches
  function makeBench(bx, bz, rotY = 0) {
    const bGroup = new THREE.Group();
    bGroup.position.set(cx + bx, 0, cz + bz);
    bGroup.rotation.y = rotY;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.15, 0.9), new THREE.MeshLambertMaterial({ color: 0xB45309 }));
    seat.position.y = 0.55;
    seat.castShadow = true;
    bGroup.add(seat);

    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.8), new THREE.MeshLambertMaterial({ color: 0x475569 }));
    leg1.position.set(-1.2, 0.25, 0);
    bGroup.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.8), new THREE.MeshLambertMaterial({ color: 0x475569 }));
    leg2.position.set(1.2, 0.25, 0);
    bGroup.add(leg2);

    scene.add(bGroup);
    colliders.push({ minX: cx + bx - 1.6, maxX: cx + bx + 1.6, minZ: cz + bz - 0.6, maxZ: cz + bz + 0.6 });
  }

  makeBench(4.5, -4.5, 0);
  makeBench(-7.0, 2.0, Math.PI / 2);

  // 7. Potted Courtyard Trees
  function makeTree(tx, tz) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.5, 0.8, 8), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
    pot.position.set(cx + tx, 0.4, cz + tz);
    pot.castShadow = true;
    scene.add(pot);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.2, 6), new THREE.MeshLambertMaterial({ color: 0x78350F }));
    trunk.position.set(cx + tx, 1.2, cz + tz);
    scene.add(trunk);

    const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95), new THREE.MeshLambertMaterial({ color: 0x15803D }));
    foliage1.position.set(cx + tx, 2.0, cz + tz);
    foliage1.castShadow = true;
    scene.add(foliage1);

    const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7), new THREE.MeshLambertMaterial({ color: 0x22C55E }));
    foliage2.position.set(cx + tx, 2.6, cz + tz);
    foliage2.castShadow = true;
    scene.add(foliage2);

    colliders.push({ minX: cx + tx - 0.7, maxX: cx + tx + 0.7, minZ: cz + tz - 0.7, maxZ: cz + tz + 0.7 });
  }

  makeTree(-7.5, -7.5);
  makeTree(7.5, -7.5);
  makeTree(7.5, 5.0);

  // 8. Improved NPC Teacher (Cikgu Aminah - Baju Kurung & Name Tag Sprite)
  const teacherGroup = new THREE.Group();
  teacherGroup.position.set(cx + 2.0, 0, cz - 3.2);

  // Baju Kurung Kain Labuh (Skirt)
  const tSkirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.56, 0.72, 12),
    new THREE.MeshLambertMaterial({ color: 0x1E3A8A })
  );
  tSkirt.position.y = 0.36;
  tSkirt.castShadow = true;
  teacherGroup.add(tSkirt);

  // Baju Kurung Blouse Top
  const tBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.65, 0.52),
    new THREE.MeshLambertMaterial({ color: 0x2563EB })
  );
  tBody.position.y = 0.95;
  tBody.castShadow = true;
  teacherGroup.add(tBody);

  // Gold Baju Kurung Hem Trim
  const tTrim = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.06, 0.54), goldBorderMat);
  tTrim.position.y = 0.65;
  teacherGroup.add(tTrim);

  // Head and Tudung (Hijab)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.55, 0);

  const tHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.44, 0.44),
    new THREE.MeshLambertMaterial({ color: 0xFDE68A })
  );
  tHead.castShadow = true;
  headGroup.add(tHead);

  // Face Eyes & Smile
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1E293B });
  const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.04), eyeMat);
  eye1.position.set(-0.1, 0.04, 0.23);
  headGroup.add(eye1);

  const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.04), eyeMat);
  eye2.position.set(0.1, 0.04, 0.23);
  headGroup.add(eye2);

  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0xF43F5E }));
  smile.position.set(0, -0.1, 0.23);
  headGroup.add(smile);

  // Tudung Mesh (Pastel Turquoise Hijab)
  const tScarfTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.52, 0.56),
    new THREE.MeshLambertMaterial({ color: 0x14B8A6 })
  );
  tScarfTop.position.set(0, 0.06, -0.02);
  headGroup.add(tScarfTop);

  const tScarfDrape = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.54, 0.42, 12),
    new THREE.MeshLambertMaterial({ color: 0x0D9488 })
  );
  tScarfDrape.position.set(0, -0.28, 0);
  headGroup.add(tScarfDrape);

  teacherHead = headGroup;
  teacherGroup.add(headGroup);

  // Left Arm (Holding Teaching Record Book)
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.55, 0.18),
    new THREE.MeshLambertMaterial({ color: 0x2563EB })
  );
  leftArm.position.set(-0.46, 0.95, 0.08);
  leftArm.rotation.x = 0.4;
  teacherGroup.add(leftArm);

  const tBook = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.48, 0.09),
    new THREE.MeshLambertMaterial({ color: 0xDC2626 })
  );
  tBook.position.set(-0.46, 0.82, 0.28);
  tBook.rotation.x = 0.4;
  teacherGroup.add(tBook);

  // Right Arm (Interactive Gentle Waving Arm)
  const armPivot = new THREE.Group();
  armPivot.position.set(0.46, 1.2, 0);

  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.48, 0.16),
    new THREE.MeshLambertMaterial({ color: 0x2563EB })
  );
  rightArm.position.set(0, -0.24, 0);
  armPivot.add(rightArm);

  const hand = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xFDE68A })
  );
  hand.position.set(0, -0.5, 0);
  armPivot.add(hand);

  teacherWavingArm = armPivot;
  teacherGroup.add(armPivot);

  // Floating 3D Name Tag Sprite above Cikgu Aminah
  const nameTag = createTextSprite('👩‍🏫 Cikgu Aminah (Guru BM)', 'rgba(30, 58, 138, 0.92)', '#FFFFFF', 512, 140, 38);
  nameTag.position.set(0, 2.38, 0);
  teacherGroup.add(nameTag);

  scene.add(teacherGroup);
  colliders.push({ minX: cx + 1.2, maxX: cx + 2.8, minZ: cz - 4.0, maxZ: cz - 2.4 });
}

// ==========================================
// ==========================================
// 5. ROOM 1: BILIK DARJAH BESTARI (x: 100, z: 100)
// ==========================================
let r1AssemblyStation;

function buildRoom1() {
  const { center } = ROOM_CONFIG.room1;
  const cx = center.x;
  const cz = center.z;

  // Warm Wooden Classroom Floor & Pastel Cream Walls
  buildCutawayRoomShell(cx, cz, 0x9E6938, 0xFFF7D6, 0xFFFBEB, 0xB45309);

  const grid = new THREE.GridHelper(22, 11, 0x78350F, 0xB45309);
  grid.position.set(cx, 0.02, cz);
  scene.add(grid);

  // 1. Large Green Chalkboard (Papan Hitam) on North Wall (-Z) with Real Chalk Handwriting
  const boardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(9.0, 3.2, 0.15),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  boardFrame.position.set(cx, 2.1, cz - 10.85);
  scene.add(boardFrame);

  // Chalkboard Surface with CanvasTexture
  const chalkTex = createTextCanvasTexture(
    'BAHASA MELAYU: EJAAN JAWI (GUNA - ݢونا)',
    '#133824',
    '#FFFFFF',
    1024,
    340,
    50,
    'SISTEM EJAAN: ݢ (Ga) + و (Wau) + ن (Nun) + ا (Alif)'
  );

  const boardSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(8.6, 2.8),
    new THREE.MeshBasicMaterial({ map: chalkTex })
  );
  boardSurface.position.set(cx, 2.1, cz - 10.76);
  scene.add(boardSurface);

  // Chalk Ledge & Chalk sticks
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.1, 0.35), new THREE.MeshLambertMaterial({ color: 0x9A3412 }));
  ledge.position.set(cx, 0.5, cz - 10.75);
  scene.add(ledge);

  // Little chalk sticks on ledge (white, yellow)
  [-0.8, -0.4, 0.2, 0.6].forEach((cxOffset, idx) => {
    const chalkStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.14, 6),
      new THREE.MeshLambertMaterial({ color: (idx % 2 === 0) ? 0xFFFFFF : 0xFDE047 })
    );
    chalkStick.rotation.z = Math.PI / 2;
    chalkStick.position.set(cx + cxOffset, 0.58, cz - 10.72);
    scene.add(chalkStick);
  });

  // 2. Round Wall Clock above Chalkboard
  const clockGroup = new THREE.Group();
  clockGroup.position.set(cx, 3.82, cz - 10.75);

  const clockRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.06, 24),
    new THREE.MeshLambertMaterial({ color: 0xDC2626 })
  );
  clockRim.rotation.x = Math.PI / 2;
  clockGroup.add(clockRim);

  const clockFace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.07, 24),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  );
  clockFace.rotation.x = Math.PI / 2;
  clockGroup.add(clockFace);

  const clockCenter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12),
    new THREE.MeshLambertMaterial({ color: 0x1E293B })
  );
  clockCenter.rotation.x = Math.PI / 2;
  clockGroup.add(clockCenter);

  // Hands (Hour & Minute)
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.02), new THREE.MeshBasicMaterial({ color: 0x1E293B }));
  hourHand.position.set(-0.06, 0.06, 0.04);
  hourHand.rotation.z = -Math.PI / 4;
  clockGroup.add(hourHand);

  const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.02), new THREE.MeshBasicMaterial({ color: 0x1E293B }));
  minHand.position.set(0.08, 0.08, 0.04);
  minHand.rotation.z = Math.PI / 3;
  clockGroup.add(minHand);

  scene.add(clockGroup);

  // 3. Educational Jawi Wall Charts (North & West Walls)
  // Chart 1 on North Wall (right of chalkboard)
  const chart1Tex = createTextCanvasTexture('CARTA HURUF JAWI', '#1E3A8A', '#FFFFFF', 512, 380, 36, 'ا ب ت ث ج ح خ د ذ ر ز س ش');
  const chart1 = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.0),
    new THREE.MeshBasicMaterial({ map: chart1Tex })
  );
  chart1.position.set(cx + 6.2, 2.2, cz - 10.85);
  scene.add(chart1);

  // Chart 2 on West Wall (front)
  const chart2Tex = createTextCanvasTexture('PADANAN JAWI & RUMI', '#065F46', '#FFFFFF', 512, 380, 36, 'G=ݢ • U=و • N=ن • A=ا');
  const chart2 = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.0),
    new THREE.MeshBasicMaterial({ map: chart2Tex })
  );
  chart2.rotation.y = Math.PI / 2;
  chart2.position.set(cx - 12.85, 2.2, cz - 6.5);
  scene.add(chart2);

  // Chart 3 on West Wall (middle)
  const chart3Tex = createTextCanvasTexture('JOM CELIK JAWI', '#9A3412', '#FFFFFF', 512, 380, 36, 'KEMBARA BAHASA BESTARI');
  const chart3 = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.0),
    new THREE.MeshBasicMaterial({ map: chart3Tex })
  );
  chart3.rotation.y = Math.PI / 2;
  chart3.position.set(cx - 12.85, 2.2, cz - 1.5);
  scene.add(chart3);

  // 4. Classroom Windows on West Wall (-X)
  for (let i = 0; i <= 1; i++) {
    const wz = cz + 3.0 + i * 4.0;
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.0, 2.6), new THREE.MeshLambertMaterial({ color: 0xCBD5E1 }));
    winFrame.position.set(cx - 12.85, 2.3, wz);
    scene.add(winFrame);

    const winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 2.4), new THREE.MeshLambertMaterial({ color: 0xBAE6FD, transparent: true, opacity: 0.85 }));
    winGlass.position.set(cx - 12.84, 2.3, wz);
    scene.add(winGlass);
  }

  // 5. Green Noticeboard at Back Corner (West Wall)
  const cNotice = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 2.6), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  cNotice.position.set(cx - 12.85, 2.2, cz + 7.5);
  scene.add(cNotice);

  const cFelt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 2.4), new THREE.MeshLambertMaterial({ color: 0x15803D }));
  cFelt.position.set(cx - 12.84, 2.2, cz + 7.5);
  scene.add(cFelt);

  // 6. Teacher's Desk (Meja Guru - Assembly Station)
  const deskGroup = new THREE.Group();
  deskGroup.position.set(cx - 5.5, 0, cz - 6.5);

  const dTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 2.2), new THREE.MeshLambertMaterial({ color: 0xB45309 }));
  dTop.position.y = 1.15;
  dTop.castShadow = true;
  deskGroup.add(dTop);

  const dBase = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.0, 2.0), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  dBase.position.y = 0.5;
  deskGroup.add(dBase);

  // Miniature 3D Globe on desk
  const gBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 12), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
  gBase.position.set(-1.4, 1.38, 0);
  deskGroup.add(gBase);

  const gStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 6), new THREE.MeshLambertMaterial({ color: 0xF59E0B }));
  gStand.position.set(-1.4, 1.55, 0);
  deskGroup.add(gStand);

  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), new THREE.MeshLambertMaterial({ color: 0x0284C7 }));
  globe.position.set(-1.4, 1.82, 0);
  deskGroup.add(globe);

  // Stack of 3 Books on desk
  const bColors = [0xEF4444, 0x3B82F6, 0x10B981];
  for (let bi = 0; bi < 3; bi++) {
    const sBook = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.8), new THREE.MeshLambertMaterial({ color: bColors[bi] }));
    sBook.position.set(1.4, 1.32 + bi * 0.09, (bi % 2 === 0 ? 0.04 : -0.04));
    deskGroup.add(sBook);
  }

  // Teacher's Ergonomic Chair behind desk
  const tChairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.1), new THREE.MeshLambertMaterial({ color: 0x1E293B }));
  tChairSeat.position.set(0, 0.65, -1.4);
  deskGroup.add(tChairSeat);

  const tChairBack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.12), new THREE.MeshLambertMaterial({ color: 0x1E293B }));
  tChairBack.position.set(0, 1.15, -1.9);
  deskGroup.add(tChairBack);

  // Open Lesson Scroll / Assembly Station Book
  const book = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.0), new THREE.MeshStandardMaterial({ color: 0xFEF3C7, emissive: 0xFDE68A, emissiveIntensity: 0.4 }));
  book.position.set(0, 1.32, 0);
  deskGroup.add(book);

  const beacon = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0xFFD166, emissive: 0xFFA200, emissiveIntensity: 0.9 }));
  beacon.position.set(0, 2.3, 0);
  beacon.rotation.z = Math.PI;
  deskGroup.add(beacon);

  const bLight = new THREE.PointLight(0xFFA200, 1.5, 6);
  bLight.position.set(0, 2.2, 0);
  deskGroup.add(bLight);

  scene.add(deskGroup);
  r1AssemblyStation = { group: deskGroup, beacon };
  // Teacher desk collider keeping maxZ at cz - 5.4 so player standing in front at cz - 5.0 has instant reach!
  colliders.push({ minX: cx - 7.8, maxX: cx - 3.2, minZ: cz - 8.5, maxZ: cz - 5.4 });

  // 7. Complete 6 Student Desks with Chairs in a 3x2 Grid
  function makeStudentDesk(dx, dz, bookColor = 0x3B82F6, pencilColor = 0xEC4899) {
    const sGroup = new THREE.Group();
    sGroup.position.set(dx, 0, dz);

    const sDesk = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 1.4), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
    sDesk.position.y = 0.95;
    sDesk.castShadow = true;
    sGroup.add(sDesk);

    // Desk Legs
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), new THREE.MeshLambertMaterial({ color: 0x334155 }));
    [[-0.95, -0.55], [0.95, -0.55], [-0.95, 0.55], [0.95, 0.55]].forEach(([lx, lz]) => {
      const l = leg.clone();
      l.position.set(lx, 0.45, lz);
      sGroup.add(l);
    });

    // Student Exercise Book on Desk
    const exBook = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.68), new THREE.MeshLambertMaterial({ color: bookColor }));
    exBook.position.set(-0.45, 1.05, 0.05);
    sGroup.add(exBook);

    // Colorful Pencil Case on Desk
    const pCase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.55), new THREE.MeshLambertMaterial({ color: pencilColor }));
    pCase.position.set(0.55, 1.05, -0.1);
    sGroup.add(pCase);

    // Student Chair behind Desk
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), new THREE.MeshLambertMaterial({ color: 0x475569 }));
    chairSeat.position.set(0, 0.52, 1.1);
    sGroup.add(chairSeat);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.55, 0.08), new THREE.MeshLambertMaterial({ color: 0x475569 }));
    chairBack.position.set(0, 0.82, 1.48);
    sGroup.add(chairBack);

    [[-0.35, 0.75], [0.35, 0.75], [-0.35, 1.45], [0.35, 1.45]].forEach(([cxo, czo]) => {
      const cLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0x1E293B }));
      cLeg.position.set(cxo, 0.25, czo);
      sGroup.add(cLeg);
    });

    scene.add(sGroup);
    // Desk collider keeping boundary tight so aisles are open and wide
    colliders.push({ minX: dx - 1.15, maxX: dx + 1.15, minZ: dz - 0.75, maxZ: dz + 1.55 });
  }

  // 3 Rows x 2 Columns = 6 Desks
  // Left Column (cx - 3.8)
  makeStudentDesk(cx - 3.8, cz - 3.0, 0x3B82F6, 0xEF4444); // Row 1 Left
  makeStudentDesk(cx - 3.8, cz + 1.5, 0xF59E0B, 0x8B5CF6); // Row 2 Left
  makeStudentDesk(cx - 3.8, cz + 6.0, 0x10B981, 0x06B6D4); // Row 3 Left

  // Right Column (cx + 4.2)
  makeStudentDesk(cx + 4.2, cz - 3.0, 0xEC4899, 0xF59E0B); // Row 1 Right (Wau desk)
  makeStudentDesk(cx + 4.2, cz + 1.5, 0x8B5CF6, 0x10B981); // Row 2 Right (Alif desk)
  makeStudentDesk(cx + 4.2, cz + 6.0, 0x06B6D4, 0xEF4444); // Row 3 Right

  // 8. Classroom Bookshelf on West Wall
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 3.8), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  shelf.position.set(cx - 11.8, 1.6, cz + 3.5);
  shelf.castShadow = true;
  scene.add(shelf);

  // Books in shelf
  const shelfColors = [0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0x8B5CF6];
  for (let sRow = 0; sRow < 3; sRow++) {
    for (let sBook = 0; sBook < 5; sBook++) {
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.55, 0.28),
        new THREE.MeshLambertMaterial({ color: shelfColors[(sRow * 3 + sBook) % shelfColors.length] })
      );
      bMesh.position.set(cx - 11.7, 0.8 + sRow * 0.9, cz + 2.3 + sBook * 0.55);
      scene.add(bMesh);
    }
  }
  colliders.push({ minX: cx - 12.6, maxX: cx - 11.0, minZ: cz + 1.5, maxZ: cz + 5.5 });

  // 9. Dustbin & Broom in Front-Left Corner
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.65, 12), new THREE.MeshLambertMaterial({ color: 0x0284C7 }));
  bin.position.set(cx - 11.8, 0.325, cz - 9.8);
  scene.add(bin);

  const broomHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  broomHandle.rotation.z = 0.25;
  broomHandle.position.set(cx - 12.1, 0.8, cz - 9.5);
  scene.add(broomHandle);

  const broomHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.4), new THREE.MeshLambertMaterial({ color: 0xFCD34D }));
  broomHead.position.set(cx - 12.3, 0.2, cz - 9.5);
  scene.add(broomHead);

  colliders.push({ minX: cx - 12.6, maxX: cx - 11.2, minZ: cz - 10.2, maxZ: cz - 9.0 });
}

// ==========================================
// 6. ROOM 2: PUSAT SUMBER / PERPUSTAKAAN (x: 200, z: 200)
// ==========================================
let r2AssemblyStation;

function buildRoom2() {
  const { center } = ROOM_CONFIG.room2;
  const cx = center.x;
  const cz = center.z;

  // 1. Soft Royal Blue Library Carpet & Cutaway Walls
  buildCutawayRoomShell(cx, cz, 0x1E3A8A, 0xF1F5F9, 0xE2E8F0, 0x1E40AF);

  const grid = new THREE.GridHelper(22, 11, 0x1D4ED8, 0x3B82F6);
  grid.position.set(cx, 0.02, cz);
  scene.add(grid);

  // 2. Wall Signage: 'PUSAT SUMBER SEKOLAH' on North Wall (-Z)
  const signBack = new THREE.Mesh(
    new THREE.BoxGeometry(7.6, 1.5, 0.16),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  signBack.position.set(cx - 0.5, 3.2, cz - 10.85);
  scene.add(signBack);

  const signTex = createTextCanvasTexture(
    'PUSAT SUMBER SEKOLAH',
    '#1E3A8A',
    '#FFFFFF',
    1024,
    256,
    52,
    'GEDUNG ILMU & PUSAT AKSES BESTARI'
  );
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(7.4, 1.3),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signFace.position.set(cx - 0.5, 3.2, cz - 10.76);
  scene.add(signFace);

  // 3. Wall Posters on West Wall (-X): 'KEMPEN NILAM' & Reading Posters
  // Poster 1: KEMPEN NILAM
  const nilamTex = createTextCanvasTexture(
    'KEMPEN NILAM',
    '#B91C1C',
    '#FFFFFF',
    512,
    360,
    42,
    'MEMBACA JAMBATAN ILMU • 1 HARI 1 BUKU'
  );
  const p1Frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 2.3), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  p1Frame.position.set(cx - 12.85, 2.35, cz + 2.5);
  scene.add(p1Frame);

  const p1Surface = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), new THREE.MeshBasicMaterial({ map: nilamTex }));
  p1Surface.rotation.y = Math.PI / 2;
  p1Surface.position.set(cx - 12.78, 2.35, cz + 2.5);
  scene.add(p1Surface);

  // Poster 2: DEKAD MEMBACA
  const dekadTex = createTextCanvasTexture(
    'DEKAD MEMBACA',
    '#047857',
    '#FFFFFF',
    512,
    360,
    42,
    'BANGSA MEMBACA BANGSA BERJAYA'
  );
  const p2Frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 2.3), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  p2Frame.position.set(cx - 12.85, 2.35, cz + 5.5);
  scene.add(p2Frame);

  const p2Surface = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), new THREE.MeshBasicMaterial({ map: dekadTex }));
  p2Surface.rotation.y = Math.PI / 2;
  p2Surface.position.set(cx - 12.78, 2.35, cz + 5.5);
  scene.add(p2Surface);

  // Poster 3: ETIKA PERPUSTAKAAN (North-West corner)
  const etikaTex = createTextCanvasTexture(
    'PERATURAN PSS',
    '#6D28D9',
    '#FFFFFF',
    512,
    340,
    38,
    '1. SENYAP • 2. SUSUN BUKU • 3. CATAT NILAM'
  );
  const p3Frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 2.1), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  p3Frame.position.set(cx - 12.85, 2.35, cz - 6.5);
  scene.add(p3Frame);

  const p3Surface = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.7), new THREE.MeshBasicMaterial({ map: etikaTex }));
  p3Surface.rotation.y = Math.PI / 2;
  p3Surface.position.set(cx - 12.78, 2.35, cz - 6.5);
  scene.add(p3Surface);

  // 4. Tall Bookshelves along North (-Z) and West (-X) walls
  function makeTallBookshelf(bx, bz, bWidth, bDepth, rotY = 0) {
    const group = new THREE.Group();
    group.position.set(bx, 0, bz);
    group.rotation.y = rotY;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 3.4, bDepth), new THREE.MeshLambertMaterial({ color: 0x5C2E0B }));
    frame.position.y = 1.7;
    frame.castShadow = true;
    group.add(frame);

    // Book rows
    const bookColors = [0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0x8B5CF6, 0xEC4899];
    for (let shelf = 0; shelf < 3; shelf++) {
      for (let bi = 0; bi < 6; bi++) {
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.65, bDepth + 0.08),
          new THREE.MeshLambertMaterial({ color: bookColors[(shelf * 3 + bi) % bookColors.length] })
        );
        book.position.set(-bWidth / 2 + 0.6 + bi * 0.55, 0.8 + shelf * 0.9, 0);
        group.add(book);
      }
    }

    scene.add(group);
    const halfDimX = rotY !== 0 ? bDepth / 2 : bWidth / 2;
    const halfDimZ = rotY !== 0 ? bWidth / 2 : bDepth / 2;
    colliders.push({ minX: bx - halfDimX - 0.2, maxX: bx + halfDimX + 0.2, minZ: bz - halfDimZ - 0.2, maxZ: bz + halfDimZ + 0.2 });
  }

  makeTallBookshelf(cx - 4.5, cz - 10.2, 7.5, 1.2, 0);
  makeTallBookshelf(cx - 11.8, cz - 2.8, 6.5, 1.2, Math.PI / 2);

  // 5. Reading Corner (Sudut Nilam) at (cx - 5.5, cz + 4.5)
  const nilamGroup = new THREE.Group();
  nilamGroup.position.set(cx - 5.5, 0, cz + 4.5);

  // Colorful Concentric Circular Rug (Teal, Amber & Cream)
  const rugOuter = new THREE.Mesh(
    new THREE.CircleGeometry(2.7, 32),
    new THREE.MeshBasicMaterial({ color: 0x0D9488, side: THREE.DoubleSide })
  );
  rugOuter.rotation.x = -Math.PI / 2;
  rugOuter.position.y = 0.025;
  nilamGroup.add(rugOuter);

  const rugMiddle = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 32),
    new THREE.MeshBasicMaterial({ color: 0xF59E0B, side: THREE.DoubleSide })
  );
  rugMiddle.rotation.x = -Math.PI / 2;
  rugMiddle.position.y = 0.03;
  nilamGroup.add(rugMiddle);

  const rugInner = new THREE.Mesh(
    new THREE.CircleGeometry(1.4, 32),
    new THREE.MeshBasicMaterial({ color: 0xFEF3C7, side: THREE.DoubleSide })
  );
  rugInner.rotation.x = -Math.PI / 2;
  rugInner.position.y = 0.035;
  nilamGroup.add(rugInner);

  // 3 Colorful Beanbag Chairs (SphereGeometry squashed on Y-axis)
  function makeBeanbag(bx, bz, colorHex, angle = 0) {
    const bbGroup = new THREE.Group();
    bbGroup.position.set(bx, 0, bz);
    bbGroup.rotation.y = angle;

    const bbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 16, 12),
      new THREE.MeshLambertMaterial({ color: colorHex })
    );
    bbMesh.scale.set(1.15, 0.62, 1.15);
    bbMesh.position.y = 0.38;
    bbMesh.castShadow = true;
    bbGroup.add(bbMesh);

    // Beanbag top tuft/seam button
    const tuft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.06, 8),
      new THREE.MeshLambertMaterial({ color: 0xFDE68A })
    );
    tuft.position.y = 0.78;
    bbGroup.add(tuft);

    nilamGroup.add(bbGroup);
  }

  // Beanbag 1: Coral Red (West side)
  makeBeanbag(-1.4, -0.8, 0xE11D48, 0.5);
  // Beanbag 2: Emerald Green (East side)
  makeBeanbag(1.3, -0.4, 0x10B981, -0.6);
  // Beanbag 3: Royal Purple (South side)
  makeBeanbag(-0.1, 1.3, 0x8B5CF6, 3.14);

  // Low Round Coffee Table in Center of Sudut Nilam
  const tableBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.36, 0.42, 16),
    new THREE.MeshLambertMaterial({ color: 0xF8FAFC })
  );
  tableBase.position.y = 0.21;
  nilamGroup.add(tableBase);

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 0.08, 24),
    new THREE.MeshLambertMaterial({ color: 0xD97706 })
  );
  tableTop.position.y = 0.44;
  tableTop.castShadow = true;
  nilamGroup.add(tableTop);

  // Open Storybook on Coffee Table
  const storybook = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.04, 0.36),
    new THREE.MeshStandardMaterial({ color: 0xFFFBEB, emissive: 0xFEF3C7, emissiveIntensity: 0.3 })
  );
  storybook.position.set(-0.1, 0.5, 0.05);
  storybook.rotation.y = 0.25;
  nilamGroup.add(storybook);

  // Colorful Drink Cup on Table
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.06, 0.14, 12),
    new THREE.MeshLambertMaterial({ color: 0x06B6D4 })
  );
  cup.position.set(0.32, 0.54, -0.15);
  nilamGroup.add(cup);

  scene.add(nilamGroup);
  // Collider for coffee table (keeping surrounding rug walkable for player and book pickup)
  colliders.push({ minX: cx - 6.2, maxX: cx - 4.8, minZ: cz + 3.8, maxZ: cz + 5.2 });

  // 6. Central Reading Table (Meja Bacaan - Assembly Station) & 4 Wooden Chairs
  const tGroup = new THREE.Group();
  tGroup.position.set(cx - 1.0, 0, cz + 1.5);

  const tTop = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.24, 3.2),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  tTop.position.y = 1.15;
  tTop.castShadow = true;
  tGroup.add(tTop);

  // 4 Table Legs
  [[-2.5, -1.3], [2.5, -1.3], [-2.5, 1.3], [2.5, 1.3]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.02, 8), new THREE.MeshLambertMaterial({ color: 0x451A03 }));
    leg.position.set(lx, 0.51, lz);
    tGroup.add(leg);
  });

  // Banker's Reading Lamp on Central Table
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.45, 8), new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.8, roughness: 0.3 }));
  lampStem.position.set(-1.8, 1.4, 0);
  tGroup.add(lampStem);

  const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.38, 12), new THREE.MeshLambertMaterial({ color: 0x15803D }));
  lampShade.rotation.z = Math.PI / 2;
  lampShade.position.set(-1.8, 1.62, 0);
  tGroup.add(lampShade);

  // Open Dictionary on Table Stand
  const openDic = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), new THREE.MeshStandardMaterial({ color: 0xFFFDF0, emissive: 0xFEF3C7, emissiveIntensity: 0.3 }));
  openDic.position.set(1.4, 1.32, 0);
  tGroup.add(openDic);

  // Glowing Assembly Beacon
  const beacon = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x60A5FA, emissive: 0x2563EB, emissiveIntensity: 0.9 }));
  beacon.position.set(0, 2.3, 0);
  beacon.rotation.z = Math.PI;
  tGroup.add(beacon);

  const bLight = new THREE.PointLight(0x3B82F6, 1.5, 6);
  bLight.position.set(0, 2.2, 0);
  tGroup.add(bLight);

  scene.add(tGroup);
  r2AssemblyStation = { group: tGroup, beacon };
  colliders.push({ minX: cx - 4.2, maxX: cx + 2.2, minZ: cz - 0.5, maxZ: cz + 3.5 });

  // 4 Wooden Chairs around Central Reading Table
  function makeLibraryChair(posX, posZ, rotY) {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(posX, 0, posZ);
    chairGroup.rotation.y = rotY;

    // Wooden Seat
    const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), new THREE.MeshLambertMaterial({ color: 0xB45309 }));
    cSeat.position.y = 0.52;
    cSeat.castShadow = true;
    chairGroup.add(cSeat);

    // Blue Fabric Cushion
    const cPad = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 0.76), new THREE.MeshLambertMaterial({ color: 0x1E3A8A }));
    cPad.position.y = 0.57;
    chairGroup.add(cPad);

    // 4 Wooden Legs
    [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]].forEach(([lx, lz]) => {
      const cLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0x78350F }));
      cLeg.position.set(lx, 0.25, lz);
      chairGroup.add(cLeg);
    });

    // Backrest Uprights & Slats
    const backPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 6), new THREE.MeshLambertMaterial({ color: 0x78350F }));
    backPost1.position.set(-0.34, 0.8, -0.36);
    chairGroup.add(backPost1);

    const backPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 6), new THREE.MeshLambertMaterial({ color: 0x78350F }));
    backPost2.position.set(0.34, 0.8, -0.36);
    chairGroup.add(backPost2);

    const backSlat = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.3, 0.06), new THREE.MeshLambertMaterial({ color: 0xB45309 }));
    backSlat.position.set(0, 0.95, -0.36);
    chairGroup.add(backSlat);

    scene.add(chairGroup);
  }

  // 2 Chairs on North side of Meja Bacaan (facing South)
  makeLibraryChair(cx - 2.5, cz - 0.75, 0);
  makeLibraryChair(cx + 0.5, cz - 0.75, 0);

  // 2 Chairs on South side of Meja Bacaan (facing North)
  makeLibraryChair(cx - 2.5, cz + 3.75, Math.PI);
  makeLibraryChair(cx + 0.5, cz + 3.75, Math.PI);

  // 7. Librarian Counter (Kaunter Peminjaman) & Stacks of Returned Books
  const counterGroup = new THREE.Group();
  counterGroup.position.set(cx + 6.0, 0, cz - 6.0);

  // Main Counter Body
  const cBody = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.15, 1.8), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
  cBody.position.y = 0.58;
  cBody.castShadow = true;
  counterGroup.add(cBody);

  // Ivory Countertop
  const cTop = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 2.0), new THREE.MeshLambertMaterial({ color: 0xF8FAFC }));
  cTop.position.y = 1.18;
  cTop.castShadow = true;
  counterGroup.add(cTop);

  // Front Service Plaque
  const plaqueTex = createTextCanvasTexture('KAUNTER PEMINJAMAN', '#1E3A8A', '#FFFFFF', 512, 128, 44);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.65), new THREE.MeshBasicMaterial({ map: plaqueTex }));
  plaque.position.set(0, 0.6, 0.92);
  counterGroup.add(plaque);

  // Stacks of Returned Books on Counter
  function makeBookStack(bx, bz, bookColors) {
    bookColors.forEach((color, idx) => {
      const sBook = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.08, 0.8),
        new THREE.MeshLambertMaterial({ color })
      );
      sBook.position.set(bx, 1.25 + idx * 0.09, bz);
      sBook.rotation.y = (idx % 2 === 0 ? 0.08 : -0.12);
      counterGroup.add(sBook);
    });
  }

  // Stack 1 (3 books)
  makeBookStack(-1.5, -0.2, [0xEF4444, 0x10B981, 0xF59E0B]);
  // Stack 2 (4 books)
  makeBookStack(1.6, 0.1, [0x3B82F6, 0x8B5CF6, 0xEC4899, 0x14B8A6]);
  // Stack 3 (2 books)
  makeBookStack(-1.2, 0.5, [0xD97706, 0x0284C7]);

  // Desktop Computer Monitor
  const pcStand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.2, 8), new THREE.MeshLambertMaterial({ color: 0x334155 }));
  pcStand.position.set(0.1, 1.3, -0.1);
  counterGroup.add(pcStand);

  const pcScreen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.06), new THREE.MeshLambertMaterial({ color: 0x0F172A }));
  pcScreen.position.set(0.1, 1.62, -0.1);
  counterGroup.add(pcScreen);

  const pcDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.54), new THREE.MeshBasicMaterial({ color: 0x0284C7 }));
  pcDisplay.position.set(0.1, 1.62, -0.065);
  counterGroup.add(pcDisplay);

  const pcKeyb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.22), new THREE.MeshLambertMaterial({ color: 0x334155 }));
  pcKeyb.position.set(0.1, 1.23, 0.35);
  counterGroup.add(pcKeyb);

  // Barcode Scanner & Pen Cup
  const penCup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.16, 12), new THREE.MeshLambertMaterial({ color: 0xF59E0B }));
  penCup.position.set(0.8, 1.28, 0.3);
  counterGroup.add(penCup);

  // Librarian Ergonomic Office Chair
  const oSeat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), new THREE.MeshLambertMaterial({ color: 0x1E293B }));
  oSeat.position.set(0, 0.65, -1.35);
  counterGroup.add(oSeat);

  const oBack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.1), new THREE.MeshLambertMaterial({ color: 0x1E293B }));
  oBack.position.set(0, 1.15, -1.75);
  counterGroup.add(oBack);

  const oPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0x64748B }));
  oPole.position.set(0, 0.3, -1.35);
  counterGroup.add(oPole);

  scene.add(counterGroup);
  colliders.push({ minX: cx + 3.4, maxX: cx + 8.5, minZ: cz - 7.5, maxZ: cz - 4.8 });

  // 8. Indoor Potted Monstera Plant
  const plantGroup = new THREE.Group();
  plantGroup.position.set(cx + 8.2, 0, cz - 2.5);

  // White Flared Ceramic Pot
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.36, 0.82, 16),
    new THREE.MeshLambertMaterial({ color: 0xF8FAFC })
  );
  pot.position.y = 0.41;
  pot.castShadow = true;
  plantGroup.add(pot);

  // Peat Soil
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.08, 16),
    new THREE.MeshLambertMaterial({ color: 0x3E2723 })
  );
  soil.position.y = 0.81;
  plantGroup.add(soil);

  // Central Bamboo Pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  pole.position.y = 1.4;
  plantGroup.add(pole);

  // 6 Broad Green Monstera Leaves
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x15803D, side: THREE.DoubleSide });
  const leafAngles = [0, 1.05, 2.1, 3.14, 4.2, 5.25];
  leafAngles.forEach((ang, idx) => {
    const leafBlade = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 0.75), leafMat);
    const height = 0.95 + idx * 0.18;
    leafBlade.position.set(Math.cos(ang) * 0.38, height, Math.sin(ang) * 0.38);
    leafBlade.rotation.y = ang + 0.3;
    leafBlade.rotation.x = 0.35;
    leafBlade.castShadow = true;
    plantGroup.add(leafBlade);
  });

  scene.add(plantGroup);
  colliders.push({ minX: cx + 7.5, maxX: cx + 8.9, minZ: cz - 3.2, maxZ: cz - 1.8 });

  // 9. Book Return Trolley (Troli Buku)
  const trolleyGroup = new THREE.Group();
  trolleyGroup.position.set(cx + 2.3, 0, cz - 4.6);

  // Steel Tubular Frame (Powder-coated blue)
  const tMat = new THREE.MeshLambertMaterial({ color: 0x0284C7 });
  const frameBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.85), tMat);
  frameBase.position.y = 0.22;
  trolleyGroup.add(frameBase);

  // 4 Rubber Caster Wheels
  [[-0.75, -0.32], [0.75, -0.32], [-0.75, 0.32], [0.75, 0.32]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8), new THREE.MeshLambertMaterial({ color: 0x1E293B }));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.1, wz);
    trolleyGroup.add(wheel);
  });

  // Vertical Side Rails
  [[-0.85, 0], [0.85, 0]].forEach(([rx, rz]) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.85), tMat);
    rail.position.set(rx, 0.75, rz);
    trolleyGroup.add(rail);
  });

  // Handle Bar on right side
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8), new THREE.MeshLambertMaterial({ color: 0x94A3B8 }));
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0.92, 1.25, 0);
  trolleyGroup.add(handle);

  // 2 Slanted Shelves loaded with books
  const shelfBottom = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.78), tMat);
  shelfBottom.position.set(0, 0.42, 0);
  trolleyGroup.add(shelfBottom);

  const shelfTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.78), tMat);
  shelfTop.position.set(0, 0.86, 0);
  trolleyGroup.add(shelfTop);

  // Colorful Returned Books loaded on the trolley
  const tColors = [0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0x8B5CF6, 0xEC4899, 0x06B6D4];
  for (let s = 0; s < 2; s++) {
    const sy = s === 0 ? 0.6 : 1.04;
    for (let b = 0; b < 6; b++) {
      const tBook = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.34, 0.65),
        new THREE.MeshLambertMaterial({ color: tColors[(s * 3 + b) % tColors.length] })
      );
      tBook.position.set(-0.6 + b * 0.24, sy, 0);
      trolleyGroup.add(tBook);
    }
  }

  // Small Front Plaque: 'TROLI BUKU'
  const tPlaqueTex = createTextCanvasTexture('TROLI BUKU', '#0F172A', '#38BDF8', 256, 96, 32);
  const tPlaque = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), new THREE.MeshBasicMaterial({ map: tPlaqueTex }));
  tPlaque.position.set(0, 0.65, 0.44);
  trolleyGroup.add(tPlaque);

  scene.add(trolleyGroup);
  colliders.push({ minX: cx + 1.2, maxX: cx + 3.4, minZ: cz - 5.2, maxZ: cz - 4.0 });
}

// ==========================================
// 7. ROOM 3: BILIK SENI VISUAL & STUDIO KHAT (x: 300, z: 300)
// ==========================================
let r3AssemblyStation;

function buildRoom3() {
  const { center } = ROOM_CONFIG.room3;
  const cx = center.x;
  const cz = center.z;

  // 1. Warm Wooden Parquet Floor & Studio Ivory Walls
  buildCutawayRoomShell(cx, cz, 0x8A5A36, 0xFFFBF5, 0xF5EBE1, 0x92400E);

  // Parquet Grid in Warm Amber Tones
  const parquetGrid = new THREE.GridHelper(22, 11, 0x78350F, 0xD97706);
  parquetGrid.position.set(cx, 0.02, cz);
  scene.add(parquetGrid);

  // Helper: Paint Splatter & Art Decal Texture
  function createSplatterDecalTexture(title, subtitle, bgColor = '#FFFDF5', bannerColor = '#D97706') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base parchment
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 1024, 512);

    // Decorative paint splash droplets in background
    const splashes = [
      { x: 120, y: 120, r: 60, col: 'rgba(239, 68, 68, 0.25)' },
      { x: 880, y: 140, r: 75, col: 'rgba(59, 130, 246, 0.25)' },
      { x: 200, y: 380, r: 50, col: 'rgba(16, 185, 129, 0.25)' },
      { x: 840, y: 400, r: 65, col: 'rgba(245, 158, 11, 0.3)' },
      { x: 500, y: 90, r: 40, col: 'rgba(139, 92, 246, 0.25)' }
    ];
    splashes.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.col;
      ctx.fill();
    });

    // Ornate Gold & Wood Frame
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 1004, 492);

    ctx.strokeStyle = bannerColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(22, 22, 980, 468);

    // Header Plaque
    ctx.fillStyle = bannerColor;
    ctx.fillRect(60, 45, 904, 110);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 50px "Fredoka", "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 512, 100);

    // Central Calligraphy & Art Motif
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 110px "Amiri", "Traditional Arabic", serif';
    ctx.fillText('اولت بوکو', 512, 270);

    ctx.fillStyle = '#475569';
    ctx.font = '600 36px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(subtitle, 512, 400);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // 2. North Wall (-Z): Main Studio Signboard
  const studioSignFrame = new THREE.Mesh(
    new THREE.BoxGeometry(8.8, 1.5, 0.16),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  studioSignFrame.position.set(cx, 3.2, cz - 10.85);
  scene.add(studioSignFrame);

  const studioSignTex = createTextCanvasTexture(
    'BILIK SENI VISUAL & STUDIO KHAT',
    '#92400E',
    '#FFFFFF',
    1024,
    256,
    48,
    'DSKP 4.4.2: MEMPERSEMBAHKAN KEINDAHAN SENI TULISAN JAWI'
  );
  const studioSignFace = new THREE.Mesh(
    new THREE.PlaneGeometry(8.6, 1.3),
    new THREE.MeshBasicMaterial({ map: studioSignTex })
  );
  studioSignFace.position.set(cx, 3.2, cz - 10.76);
  scene.add(studioSignFace);

  // 3. West Wall (-X): Calligraphy Scrolls & Batik Motifs
  const westMuralTex = createSplatterDecalTexture(
    'KHAZANAH SENI KALIGRAFI JAWI',
    'Keindahan Seni Tulisan Jawi Melalui Simpulan Bahasa',
    '#FFFDF8',
    '#065F46'
  );
  const westFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 4.8), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  westFrame.position.set(cx - 12.85, 2.6, cz);
  scene.add(westFrame);

  const westSurface = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.2), new THREE.MeshBasicMaterial({ map: westMuralTex }));
  westSurface.rotation.y = Math.PI / 2;
  westSurface.position.set(cx - 12.78, 2.6, cz);
  scene.add(westSurface);

  // 4. East Wall (+X): Art Appreciation & Motivation Banner
  const eastMuralTex = createTextCanvasTexture(
    'APRESIASI SENI KHAT',
    '#1E3A8A',
    '#FFFFFF',
    1024,
    340,
    46,
    'EKSPRESI KREATIF • CORAK BATIK • SONGKET DIRAJA'
  );
  const eastFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 4.4), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  eastFrame.position.set(cx + 12.85, 2.6, cz);
  scene.add(eastFrame);

  const eastSurface = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.0), new THREE.MeshBasicMaterial({ map: eastMuralTex }));
  eastSurface.rotation.y = -Math.PI / 2;
  eastSurface.position.set(cx + 12.78, 2.6, cz);
  scene.add(eastSurface);

  // 5. Standing 3D Wooden Art Easels (Kanvas Lukisan)
  function createArtEasel(posX, posZ, rotY, canvasColor = 0xFEF3C7, artText = 'Seni Khat') {
    const easelGroup = new THREE.Group();
    easelGroup.position.set(posX, 0, posZ);
    easelGroup.rotation.y = rotY;

    const woodMat = new THREE.MeshLambertMaterial({ color: 0x854D0E });

    // 2 Front Tripod Legs
    [-0.45, 0.45].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6), woodMat);
      leg.position.set(lx, 1.15, 0);
      leg.rotation.z = (lx > 0 ? 0.12 : -0.12);
      easelGroup.add(leg);
    });

    // 1 Back Support Leg
    const backLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6), woodMat);
    backLeg.position.set(0, 1.15, 0.55);
    backLeg.rotation.x = -0.25;
    easelGroup.add(backLeg);

    // Crossbar Shelf
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.18), woodMat);
    shelf.position.set(0, 0.95, -0.06);
    easelGroup.add(shelf);

    // Stretched Art Canvas on the Easel
    const canvasBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.25, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x78350F })
    );
    canvasBack.position.set(0, 1.55, -0.05);
    easelGroup.add(canvasBack);

    // Artwork texture
    const paintingTex = createTextCanvasTexture(artText, '#1E293B', '#F59E0B', 512, 600, 48, 'KARYA MURID');
    const canvasFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 1.15),
      new THREE.MeshBasicMaterial({ map: paintingTex })
    );
    canvasFace.position.set(0, 1.55, -0.02);
    easelGroup.add(canvasFace);

    scene.add(easelGroup);
    colliders.push({ minX: posX - 0.7, maxX: posX + 0.7, minZ: posZ - 0.7, maxZ: posZ + 0.7 });
  }

  // 4 Art Easels around the studio aisles
  createArtEasel(cx - 7.5, cz - 4.5, 0.4, 0xFEF3C7, 'Corak Batik');
  createArtEasel(cx + 7.5, cz - 4.5, -0.4, 0xDBEAFE, 'Seni Songket');
  createArtEasel(cx - 7.5, cz + 4.5, 0.2, 0xFEE2E2, 'Khat Nasakh');
  createArtEasel(cx + 7.5, cz + 4.5, -0.2, 0xECFDF5, 'Khat Thuluth');

  // 6. Studio Work Tables with Paint Palettes & Art Supplies
  function createArtTable(posX, posZ) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(posX, 0, posZ);

    const deskMat = new THREE.MeshLambertMaterial({ color: 0x92400E });

    // Tabletop
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 1.6), deskMat);
    top.position.y = 0.95;
    top.castShadow = true;
    tableGroup.add(top);

    // 4 Legs
    [[-1.6, -0.65], [1.6, -0.65], [-1.6, 0.65], [1.6, 0.65]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 6), deskMat);
      leg.position.set(lx, 0.475, lz);
      tableGroup.add(leg);
    });

    // 3D Wooden Paint Palette on table
    const paletteMat = new THREE.MeshLambertMaterial({ color: 0xD97706 });
    const paletteMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.03, 16), paletteMat);
    paletteMesh.position.set(-0.7, 1.02, 0);
    paletteMesh.scale.set(1.2, 1, 0.85);
    tableGroup.add(paletteMesh);

    // Dollops of paint on the palette
    const paintColors = [0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0x8B5CF6, 0xFFFFFF];
    paintColors.forEach((color, idx) => {
      const ang = (idx * Math.PI * 1.5) / 5 - 1.2;
      const dot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.05, 0.02, 8),
        new THREE.MeshStandardMaterial({ color, roughness: 0.2 })
      );
      dot.position.set(-0.7 + Math.cos(ang) * 0.28, 1.04, Math.sin(ang) * 0.2);
      tableGroup.add(dot);
    });

    // Calligraphy Brush resting on palette
    const brushStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6),
      new THREE.MeshLambertMaterial({ color: 0x451A03 })
    );
    brushStem.rotation.z = Math.PI / 3;
    brushStem.position.set(-0.55, 1.04, 0.05);
    tableGroup.add(brushStem);

    // Ceramic Paint Water Jars
    const jar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.24, 12), new THREE.MeshLambertMaterial({ color: 0x38BDF8 }));
    jar1.position.set(0.6, 1.12, -0.3);
    tableGroup.add(jar1);

    const jar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.2, 12), new THREE.MeshLambertMaterial({ color: 0xFDE047 }));
    jar2.position.set(0.85, 1.1, -0.25);
    tableGroup.add(jar2);

    // Stack of Parchment / Art Paper
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.6), new THREE.MeshLambertMaterial({ color: 0xFFFDF0 }));
    paper.position.set(0.3, 1.02, 0.2);
    tableGroup.add(paper);

    scene.add(tableGroup);
    colliders.push({ minX: posX - 2.0, maxX: posX + 2.0, minZ: posZ - 1.0, maxZ: posZ + 1.0 });
  }

  // Two studio work desks on the sides
  createArtTable(cx - 4.5, cz - 7.5);
  createArtTable(cx + 4.5, cz - 7.5);

  // 7. Central Masterpiece Canvas (Kanvas Pameran Utama - Assembly Station)
  const podGroup = new THREE.Group();
  podGroup.position.set(cx, 0, cz - 0.5);

  // Grand Wooden Art Easel Stand
  const gWoodMat = new THREE.MeshLambertMaterial({ color: 0x78350F });
  [-0.9, 0.9].forEach(gx => {
    const mainPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 8), gWoodMat);
    mainPost.position.set(gx, 1.7, 0);
    podGroup.add(mainPost);
  });

  const topCrossbar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.15), gWoodMat);
  topCrossbar.position.set(0, 3.2, 0);
  podGroup.add(topCrossbar);

  const baseShelf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.25), gWoodMat);
  baseShelf.position.set(0, 0.9, 0);
  podGroup.add(baseShelf);

  // Large Masterpiece Canvas Board (2.2m x 1.7m)
  const masterTex = createSplatterDecalTexture(
    'KANVAS PAMERAN UTAMA',
    'Dekati & Tekan E untuk mereka bentuk karya seni khat Jawi',
    '#FFFDF5',
    '#D97706'
  );

  const masterFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 1.85, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.75, roughness: 0.25 })
  );
  masterFrame.position.set(0, 1.95, -0.05);
  podGroup.add(masterFrame);

  const masterFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.7),
    new THREE.MeshBasicMaterial({ map: masterTex })
  );
  masterFace.position.set(0, 1.95, 0.01);
  podGroup.add(masterFace);

  // Glowing Golden Assembly Beacon overhead
  const beacon = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.95, 8),
    new THREE.MeshStandardMaterial({ color: 0xF59E0B, emissive: 0xD97706, emissiveIntensity: 0.95 })
  );
  beacon.position.set(0, 3.5, 0);
  beacon.rotation.z = Math.PI;
  podGroup.add(beacon);

  const bLight = new THREE.PointLight(0xF59E0B, 1.8, 8);
  bLight.position.set(0, 3.2, 0.5);
  podGroup.add(bLight);

  scene.add(podGroup);
  r3AssemblyStation = { group: podGroup, beacon };
  colliders.push({ minX: cx - 1.8, maxX: cx + 1.8, minZ: cz - 1.2, maxZ: cz + 0.8 });
}

// ==========================================
// 8. GLOWING TELEPORTATION PORTALS
// ==========================================
const portalPedestalGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.35, 16);
const portalCoreGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.9, 16);
const portalHaloGeo = new THREE.TorusGeometry(1.0, 0.08, 12, 24);

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
createPortal('portalR2', 106.5, 94.0, 0x3B82F6, 0x2563EB);

// 3. Room 2 Exit Portal -> Teleports to Room 3
createPortal('portalR3', 206.5, 194.0, 0x10B981, 0x059669);

// 4. Return Portal in Room 3 -> Teleports back to Lobby
createPortal('returnLobby', 306.5, 294.0, 0x8B5CF6, 0x7C3AED);

// ==========================================
// 9. COLLECTIBLE SPAWNER
// ==========================================
function setupCollectiblesList(items, geomType = 'crystal') {
  const group = new THREE.Group();
  scene.add(group);

  items.forEach((item) => {
    const itemGroup = new THREE.Group();
    itemGroup.position.set(item.pos.x, item.pos.y, item.pos.z);

    let mainMesh;
    if (geomType === 'crystal') {
      const hexColor = '#' + item.color.toString(16).padStart(6, '0');
      const jawiTex = createJawiTileTexture(item.char, item.name, hexColor);

      // 3D Rounded Wooden/Pastel Tile (BoxGeometry(0.95, 0.95, 0.18)) with gold border frame
      const sideMat = new THREE.MeshStandardMaterial({
        color: 0xD97706,
        metalness: 0.55,
        roughness: 0.35
      });
      const faceMat = new THREE.MeshStandardMaterial({
        map: jawiTex,
        roughness: 0.25
      });

      // 6 materials: [right, left, top, bottom, front, back]
      const tileMats = [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat];
      mainMesh = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.18), tileMats);

      // Gold outer frame border
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.65, roughness: 0.25 });
      const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 0.12), frameMat);
      mainMesh.add(frameMesh);
      mainMesh.scale.set(1.5, 1.5, 1.5); // 1.5x Enlarge

      // Floating 3D Sprite Label directly above the tile
      const labelSprite = createTextSprite(
        `${item.char} (${item.name})`,
        'rgba(15, 23, 42, 0.94)',
        '#FDE68A',
        512,
        180,
        64
      );
      labelSprite.scale.set(3.2, 1.6, 1);
      labelSprite.position.set(0, 1.45, 0);
      itemGroup.add(labelSprite);
    } else if (geomType === 'book') {
      const bookGroup = new THREE.Group();

      const coverMat = new THREE.MeshStandardMaterial({
        color: item.color,
        roughness: 0.3,
        metalness: 0.2,
        emissive: item.color,
        emissiveIntensity: 0.35
      });

      const pagesMat = new THREE.MeshStandardMaterial({
        color: 0xFFFDF0,
        roughness: 0.6
      });

      const goldTrimMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        metalness: 0.75,
        roughness: 0.25,
        emissive: 0xD97706,
        emissiveIntensity: 0.35
      });

      // Front Hardcover Plate
      const frontCover = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.02, 0.04), coverMat);
      frontCover.position.set(0.04, 0, 0.11);
      bookGroup.add(frontCover);

      // Gold Crest / Emblem on Front Cover
      const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), goldTrimMat);
      emblem.rotation.x = Math.PI / 2;
      emblem.position.set(0.04, 0.05, 0.135);
      bookGroup.add(emblem);

      // Back Hardcover Plate
      const backCover = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.02, 0.04), coverMat);
      backCover.position.set(0.04, 0, -0.11);
      bookGroup.add(backCover);

      // Thick White/Cream Pages Block Inside
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.94, 0.18), pagesMat);
      pages.position.set(0.06, 0, 0);
      bookGroup.add(pages);

      // Colored Spine (Left Side)
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.02, 0.24), coverMat);
      spine.position.set(-0.35, 0, 0);
      bookGroup.add(spine);

      // Gold Corner Protectors
      [[-0.32, 0.49], [-0.32, -0.49], [0.4, 0.49], [0.4, -0.49]].forEach(([cxo, cyo]) => {
        const corner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.28), goldTrimMat);
        corner.position.set(cxo, cyo, 0);
        bookGroup.add(corner);
      });

      // Silk Bookmark Ribbon Hanging Down
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.02), new THREE.MeshLambertMaterial({ color: 0xDC2626 }));
      ribbon.position.set(0.12, -0.52, 0.02);
      ribbon.rotation.z = 0.15;
      bookGroup.add(ribbon);

      bookGroup.scale.set(1.5, 1.5, 1.5); // 1.5x Enlarge
      mainMesh = bookGroup;

      // Floating THREE.Sprite tag directly above each Jawi book fragment
      const tagText = `${item.char} (${item.name})`;
      const bookTag = createTextSprite(
        `📖 ${tagText}`,
        'rgba(15, 23, 42, 0.94)',
        '#67E8F9',
        512,
        180,
        64
      );
      bookTag.scale.set(3.2, 1.6, 1);
      bookTag.position.set(0, 1.65, 0);
      itemGroup.add(bookTag);
    } else {
      // 3D Art Studio Supplies (geomType === 'orb' / Alatan Seni Khat)
      const supplyGroup = new THREE.Group();

      if (item.id === 'orb1') {
        // Berus Khat (Bamboo Calligraphy Brush)
        const stemMat = new THREE.MeshLambertMaterial({ color: 0xD97706 });
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8), stemMat);
        supplyGroup.add(stem);

        // Gold Ferrule Ring
        const ferrule = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 0.16, 8),
          new THREE.MeshStandardMaterial({ color: 0xFCD34D, metalness: 0.85, roughness: 0.2 })
        );
        ferrule.position.y = 0.58;
        supplyGroup.add(ferrule);

        // Pointed Calligraphy Bristle Tip
        const tip = new THREE.Mesh(
          new THREE.ConeGeometry(0.075, 0.38, 12),
          new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.5 })
        );
        tip.position.y = 0.85;
        supplyGroup.add(tip);

        supplyGroup.rotation.z = Math.PI / 4;
      } else if (item.id === 'orb2') {
        // Palet Warna (Artist Palette)
        const palMat = new THREE.MeshLambertMaterial({ color: 0xB45309 });
        const pal = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.06, 16), palMat);
        pal.scale.set(1.15, 1, 0.85);
        pal.rotation.x = Math.PI / 4;
        supplyGroup.add(pal);

        // Paint drops on palette
        const colors = [0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0xFFFFFF];
        colors.forEach((col, idx) => {
          const ang = (idx * Math.PI * 1.5) / 4 - 1.2;
          const drop = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.06, 0.03, 8),
            new THREE.MeshStandardMaterial({ color: col, roughness: 0.2 })
          );
          drop.position.set(Math.cos(ang) * 0.35, 0.04, Math.sin(ang) * 0.25);
          supplyGroup.add(drop);
        });
      } else {
        // Kanvas Lukisan (Mini Framed Art Canvas)
        const frameMat = new THREE.MeshLambertMaterial({ color: 0x78350F });
        const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.08), frameMat);
        supplyGroup.add(frameMesh);

        const faceMat = new THREE.MeshStandardMaterial({ color: 0xFFFDF0, roughness: 0.4 });
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.98), faceMat);
        face.position.z = 0.045;
        supplyGroup.add(face);

        const goldBorder = new THREE.Mesh(
          new THREE.BoxGeometry(0.79, 1.02, 0.04),
          new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.7 })
        );
        goldBorder.position.z = 0.025;
        supplyGroup.add(goldBorder);
      }

      supplyGroup.scale.set(1.5, 1.5, 1.5);
      mainMesh = supplyGroup;

      // Floating THREE.Sprite label showing Art Supply name
      const medalTag = createTextSprite(
        `${item.char} ${item.label}`,
        'rgba(15, 23, 42, 0.94)',
        '#FDE047',
        512,
        180,
        64
      );
      medalTag.scale.set(3.2, 1.6, 1);
      medalTag.position.set(0, 1.7, 0);
      itemGroup.add(medalTag);
    }
    mainMesh.castShadow = true;
    itemGroup.add(mainMesh);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.065, 8, 24),
      new THREE.MeshStandardMaterial({ color: item.color, emissive: item.color, emissiveIntensity: 0.85 })
    );
    ring.rotation.x = Math.PI / 2;
    itemGroup.add(ring);

    const light = new THREE.PointLight(item.color, 1.4, 5);
    itemGroup.add(light);

    item.mesh = itemGroup;
    item.gemMesh = mainMesh;
    item.ringMesh = ring;
    item.isPopping = false;
    item.popScale = 1.0;

    group.add(itemGroup);
  });
}

// Initialize collectibles across all 3 rooms
setupCollectiblesList(COLLECTIBLES_R1, 'crystal');
setupCollectiblesList(COLLECTIBLES_R2, 'book');
setupCollectiblesList(COLLECTIBLES_R3, 'orb');

// ==========================================
// 10. 3D PLAYER AVATAR SETUP (ANIMATED MALAYSIAN PRIMARY SCHOOL STUDENT)
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
const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1E3A8A }); // Navy blue primary school pants (0x1E3A8A)
const skinMat = new THREE.MeshLambertMaterial({ color: 0xFDE68A }); // Warm skin tone
const tieMat = new THREE.MeshLambertMaterial({ color: 0xDC2626 }); // Red school tie
const darkMat = new THREE.MeshBasicMaterial({ color: 0x0F172A }); // Eyes & school shoes
const hairMat = new THREE.MeshLambertMaterial({ color: 0x1E293B }); // Dark hair
const backpackMat = new THREE.MeshLambertMaterial({ color: 0x2563EB }); // Royal blue school backpack (beg sekolah)
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

// 2. 3D School Backpack (Beg Sekolah) on their back (z = +0.32)
const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.26), backpackMat);
backpack.position.set(0, 0.26, 0.32);
backpack.castShadow = true;
playerBody.add(backpack);

// Front Pocket on Backpack
const bagPocket = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.1), bagPocketMat);
bagPocket.position.set(0, 0.18, 0.47);
playerBody.add(bagPocket);

// Backpack Shoulder Straps
[-0.2, 0.2].forEach((sx) => {
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.04), backpackMat);
  strap.position.set(sx, 0.28, -0.21);
  playerBody.add(strap);
});

// 3. Cute Head with Cap & Hair
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 8), skinMat);
neck.position.set(0, 0.56, 0);
playerBody.add(neck);

const headGroup = new THREE.Group();
headGroup.position.set(0, 0.82, 0);
playerBody.add(headGroup);

const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.44), skinMat);
headMesh.castShadow = true;
headGroup.add(headMesh);

// Cute Eyes on Front (-Z)
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

// Cute School Cap Visor (Navy Blue)
const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.18), pantsMat);
capVisor.position.set(0, 0.22, -0.26);
headGroup.add(capVisor);

// 4. Separate Left & Right Arms (Shoulder Pivots)
function makeStudentArm(isLeft) {
  const armPivot = new THREE.Group();
  const armX = isLeft ? -0.42 : 0.42;
  armPivot.position.set(armX, 0.44, 0);

  // Short White Sleeve
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.2), shirtMat);
  sleeve.position.set(0, -0.08, 0);
  sleeve.castShadow = true;
  armPivot.add(sleeve);

  // Bare Forearm & Hand (Skin)
  const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.15), skinMat);
  forearm.position.set(0, -0.28, 0);
  armPivot.add(forearm);

  playerBody.add(armPivot);
  return armPivot;
}

leftArmPivot = makeStudentArm(true);
rightArmPivot = makeStudentArm(false);

// 5. Separate Left & Right Legs (Hip Pivots attached directly to playerGroup)
function makeStudentLeg(isLeft) {
  const legPivot = new THREE.Group();
  const legX = isLeft ? -0.16 : 0.16;
  legPivot.position.set(legX, 0.62, 0);

  // Navy Blue School Pants (0x1E3A8A)
  const pants = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.24), pantsMat);
  pants.position.set(0, -0.19, 0);
  pants.castShadow = true;
  legPivot.add(pants);

  // White School Socks
  const sock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.22), shirtMat);
  sock.position.set(0, -0.42, 0);
  legPivot.add(sock);

  // Black School Shoes
  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.3), darkMat);
  shoe.position.set(0, -0.52, -0.04);
  shoe.castShadow = true;
  legPivot.add(shoe);

  playerGroup.add(legPivot);
  return legPivot;
}

leftLegPivot = makeStudentLeg(true);
rightLegPivot = makeStudentLeg(false);

// Ground Shadow Disc
const pShadowMat = new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.35 });
const playerShadow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), pShadowMat);
playerShadow.rotation.x = -Math.PI / 2;
playerShadow.position.y = 0.03;
playerGroup.add(playerShadow);

// ==========================================
// 10.5 DYNAMIC 3D FLOOR GUIDE ARROW (ANAK PANAH PANDUAN)
// ==========================================
const guideArrowGroup = new THREE.Group();
guideArrowGroup.position.set(0, 0.25, 4.5);
scene.add(guideArrowGroup);

// Glowing Gold 3D Arrow Mesh (ConeGeometry + BoxGeometry shaft) hovering at y = 0.25
const arrowMat = new THREE.MeshStandardMaterial({
  color: 0xF59E0B,
  emissive: 0xFBBF24,
  emissiveIntensity: 0.95,
  metalness: 0.5,
  roughness: 0.2
});

const arrowMeshContainer = new THREE.Group();
arrowMeshContainer.position.set(0, 0, -1.35); // Hovering 1.35m just in front of player

// Arrow Shaft (BoxGeometry)
const arrowShaft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.42), arrowMat);
arrowShaft.position.set(0, 0, 0.22);
arrowMeshContainer.add(arrowShaft);

// Arrow Head Cone (ConeGeometry pointing forward toward -Z)
const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 16), arrowMat);
arrowHead.rotation.x = -Math.PI / 2;
arrowHead.position.set(0, 0, -0.22);
arrowMeshContainer.add(arrowHead);

// Soft Gold Glow PointLight
const arrowGlowLight = new THREE.PointLight(0xF59E0B, 1.2, 3.5);
arrowGlowLight.position.set(0, 0.2, 0);
arrowMeshContainer.add(arrowGlowLight);

guideArrowGroup.add(arrowMeshContainer);

// ==========================================
// 11. TELEPORTATION SYSTEM
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

  playerGroup.rotation.y = 0; // Face forward towards room interior (-Z)
  // Instantly snap Roblox 3rd-person camera close behind player
  camera.position.set(sx, 4.5, sz + 7.5);
  camera.lookAt(sx, 1.2, sz);

  updateLocationBadge(targetRoom.badge, roomId !== 'lobby');
  updateInventoryHUD();
  showItemToast('✨', `Selamat Datang ke ${targetRoom.name}!`);

  if (roomId === 'room1') {
    updateMissionText('Misi: Cari 4 kristal Jawi di bilik darjah & susun di Meja Guru.');
  } else if (roomId === 'room2') {
    updateMissionText('Misi: Cari 2 kad Jawi di Pusat Sumber & bina simpulan bahasa di Meja Bacaan.');
  } else if (roomId === 'room3') {
    updateMissionText('Misi: Cari 3 alatan seni di bilik seni & persembahkan karya di Kanvas Utama.');
  } else {
    updateMissionText('Misi: Terokai dataran & dekati portal bercahaya untuk ke Bilik 1.');
  }
}

// Register teleport handlers with ui.js
registerTeleportHandlers({
  toLobby: () => teleportTo('lobby'),
  toRoom1: () => teleportTo('room1'),
  toRoom2: () => teleportTo('room2'),
  toRoom3: () => teleportTo('room3')
});

// ==========================================
// 12. COLLISION DETECTION
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
// 13. INPUT HANDLING
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
// 14. GAME LOOP & ANIMATION
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

  // Beacon Animations
  if (r1AssemblyStation) {
    r1AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r1AssemblyStation.beacon.position.y = 2.3 + Math.sin(time * 2.8) * 0.12;
  }
  if (r2AssemblyStation) {
    r2AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r2AssemblyStation.beacon.position.y = 2.3 + Math.sin(time * 2.8) * 0.12;
  }
  if (r3AssemblyStation) {
    r3AssemblyStation.beacon.rotation.y += 2.2 * delta;
    r3AssemblyStation.beacon.position.y = 2.3 + Math.sin(time * 2.8) * 0.12;
  }

  // NPC Teacher (Cikgu Aminah) Gentle Idle Waving Animation
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

  activeCollectibles.forEach((item, index) => {
    if (!item.collected && item.mesh) {
      if (gameState.currentRoom === 'room1') {
        item.gemMesh.rotation.y += 1.8 * delta;
        item.gemMesh.rotation.x = Math.sin(time * 2.5 + index) * 0.12;
      } else if (gameState.currentRoom === 'room2') {
        item.gemMesh.rotation.y += 1.6 * delta;
        item.gemMesh.rotation.x = 0.32 + Math.sin(time * 2.2 + index) * 0.1;
      } else if (gameState.currentRoom === 'room3') {
        item.gemMesh.rotation.y += 1.8 * delta;
        item.gemMesh.rotation.z = Math.sin(time * 2.5 + index) * 0.08;
      } else {
        item.gemMesh.rotation.y += 2.0 * delta;
        item.gemMesh.rotation.x += 1.0 * delta;
      }
      item.ringMesh.rotation.z += 1.5 * delta;
      const bob = Math.sin(time * 3.0 + index) * 0.14;
      item.mesh.position.y = item.pos.y + bob;

      // 2D XZ Distance Pickup Check (Ignores placement Y-height on furniture)
      const dx = playerGroup.position.x - item.mesh.position.x;
      const dz = playerGroup.position.z - item.mesh.position.z;
      const dist2D = Math.hypot(dx, dz);
      if (dist2D < PICKUP_RADIUS_2D) {
        collectItem(item, gameState.currentRoom);
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

      // Natural Limb Swing Animation (Math.sin(time * 12) * 0.45)
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
      // Idle Breathing & Smooth Limb Reset
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
      const uncollected = COLLECTIBLES_R1.filter(item => !item.collected);
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
      promptText = 'Tekan E untuk Masuk ke Bilik 1 (Bilik Darjah)';
    }
  } else if (gameState.currentRoom === 'room1') {
    const dTable = playerGroup.position.distanceTo(r1AssemblyStation.group.position);
    const dPortal = playerGroup.position.distanceTo(portals.portalR2.group.position);
    if (dTable <= 2.8) {
      foundTarget = 'tableR1';
      promptText = 'Tekan E untuk Susun Huruf Jawi (Meja Guru)';
    } else if (dPortal <= 2.6) {
      foundTarget = 'portalR2';
      promptText = 'Tekan E untuk Masuk ke Bilik 2 (Pusat Sumber)';
    }
  } else if (gameState.currentRoom === 'room2') {
    const dTable = playerGroup.position.distanceTo(r2AssemblyStation.group.position);
    const dPortal = playerGroup.position.distanceTo(portals.portalR3.group.position);
    if (dTable <= 3.2) {
      foundTarget = 'tableR2';
      promptText = 'Tekan E untuk Bina Simpulan Bahasa Jawi (Meja Bacaan)';
    } else if (dPortal <= 2.6) {
      foundTarget = 'portalR3';
      promptText = 'Tekan E untuk Masuk ke Bilik 3 (Studio Seni Khat)';
    }
  } else if (gameState.currentRoom === 'room3') {
    const dTable = playerGroup.position.distanceTo(r3AssemblyStation.group.position);
    const dReturn = playerGroup.position.distanceTo(portals.returnLobby.group.position);
    if (dTable <= 3.2) {
      foundTarget = 'tableR3';
      promptText = 'Tekan E untuk Studio Seni Khat Jawi (Kanvas Pameran Utama)';
    } else if (dReturn <= 2.6) {
      foundTarget = 'returnLobby';
      promptText = 'Tekan E untuk Kembali ke Dataran Sekolah';
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

// Initialize dynamic HUD
updateInventoryHUD();

// Start Game Loop
animate();
