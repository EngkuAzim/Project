// ==========================================
// ROOMS/ROOM1.JS - Taman Pagar Sesat Jawi (Hedge Maze at 100, 100)
// ==========================================
import { createTextCanvasTexture, createTextSprite, createJawiTileTexture, resolveRoomArgs } from './helpers.js';

export function buildRoom1(arg1, arg2, arg3) {
  const { targetGroup: roomGroup, collidersList: roomColliders } = resolveRoomArgs(arg1, arg2, arg3);
  const cx = 100, cz = 100;
  const w = 36, d = 32;
  const hw = w / 2, hd = d / 2; // hw = 18, hd = 16

  // 1. Lush Garden Grass Base (36x32) with Surface at y = 0.0
  const baseGeo = new THREE.BoxGeometry(w, 0.4, d);
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x15803D });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(cx, -0.2, cz);
  baseMesh.receiveShadow = true;
  roomGroup.add(baseMesh);

  // Outer Stone Rim
  const rimGeo = new THREE.BoxGeometry(w + 0.8, 0.6, d + 0.8);
  const rimMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.set(cx, -0.5, cz);
  roomGroup.add(rimMesh);

  // Tiled Garden GridHelper slightly above floor at y = 0.01 for immediate tiled texture
  const gridHelper = new THREE.GridHelper(Math.max(w, d), Math.round(Math.max(w, d)), 0x166534, 0x14532D);
  gridHelper.position.set(cx, 0.01, cz);
  if (gridHelper.material) {
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
  }
  roomGroup.add(gridHelper);

  // Topiary Hedge Material
  const hedgeMat = new THREE.MeshLambertMaterial({ color: 0x166534 });

  function addHedge(hx, hz, hwid, hdep) {
    const hMesh = new THREE.Mesh(new THREE.BoxGeometry(hwid, 1.8, hdep), hedgeMat);
    hMesh.position.set(hx, 0.9, hz);
    hMesh.castShadow = true;
    hMesh.receiveShadow = true;
    roomGroup.add(hMesh);
    roomColliders.push({
      minX: hx - hwid / 2 - 0.2,
      maxX: hx + hwid / 2 + 0.2,
      minZ: hz - hdep / 2 - 0.2,
      maxZ: hz + hdep / 2 + 0.2
    });
  }

  // A. Outer Perimeter Hedges (with entrance gap at South x=86 and exit at North-East x=114)
  // North hedge: 82 to 110 (opening at 110-118 for exit plaza)
  addHedge(cx - 2, cz - hd, w - 8, 1.0);
  // South hedge: opening at 84-88 for entrance
  addHedge(82 + (84 - 82)/2, cz + hd, 2, 1.0); // West of opening
  addHedge(cx + 4, cz + hd, w - 8, 1.0);       // East of opening
  // West hedge
  addHedge(cx - hw, cz, 1.0, d);
  // East hedge
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

  // Stone walkway pavers along the main paths (Clean, unobstructed walking surface)
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xE2E8F0 });
  const pathGeo1 = new THREE.PlaneGeometry(2.4, 28);
  const path1 = new THREE.Mesh(pathGeo1, stoneMat);
  path1.rotation.x = -Math.PI / 2;
  path1.position.set(86.0, 0.02, 100.0);
  roomGroup.add(path1);

  const pathGeo2 = new THREE.PlaneGeometry(28, 2.4);
  const path2 = new THREE.Mesh(pathGeo2, stoneMat);
  path2.rotation.x = -Math.PI / 2;
  path2.position.set(100.0, 0.02, 104.0);
  roomGroup.add(path2);

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
  roomGroup.add(archGroup);

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

  roomGroup.add(stationGroup);
  roomColliders.push({ minX: 108.5, maxX: 111.5, minZ: 87.0, maxZ: 89.0 });

  return {
    r1AssemblyStation: { group: stationGroup, beacon },
    spawnR1Checkpoints
  };
}

/**
 * Spawns 10 sequential Huruf Jawi checkpoints as clean, floating Jawi tablets without obstacle clutter.
 */
export function spawnR1Checkpoints(items, targetGroup) {
  items.forEach((item) => {
    // Floating Checkpoint Tablet Mesh & Lights (Unobstructed pathway)
    const itemGroup = new THREE.Group();
    itemGroup.position.set(item.pos.x, item.pos.y, item.pos.z);

    const cGroup = new THREE.Group();
    const hexColor = '#' + item.color.toString(16).padStart(6, '0');
    const tileTex = createJawiTileTexture(item.char, item.name, hexColor);
    const faceMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.25 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.7, roughness: 0.3 });
    const tileMats = [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat];

    const tablet = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.22), tileMats);
    cGroup.add(tablet);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.8 });
    const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.18, 0.16), frameMat);
    tablet.add(frameMesh);

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

    cGroup.castShadow = true;
    itemGroup.add(cGroup);

    // Glowing point light
    const light = new THREE.PointLight(item.color, 1.5, 5);
    itemGroup.add(light);

    item.mesh = itemGroup;
    item.gemMesh = cGroup;
    item.ringMesh = null;
    item.pointLight = light;
    item.isPopping = false;
    item.popScale = 1.0;

    targetGroup.add(itemGroup);
  });
}

