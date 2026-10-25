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

  // 2. Cartoon Low-Poly Trees Helper & Placements
  function createLowPolyTree(tx, tz) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 0, tz);

    // Brown Trunk
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x78350F });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.8, 8), trunkMat);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Lower Foliage Cone
    const coneMat1 = new THREE.MeshLambertMaterial({ color: 0x15803D });
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 8), coneMat1);
    cone1.position.y = 2.4;
    cone1.castShadow = true;
    treeGroup.add(cone1);

    // Upper Overlapping Foliage Cone
    const coneMat2 = new THREE.MeshLambertMaterial({ color: 0x22C55E });
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.8, 8), coneMat2);
    cone2.position.y = 3.5;
    cone2.castShadow = true;
    treeGroup.add(cone2);

    roomGroup.add(treeGroup);
    roomColliders.push({ minX: tx - 0.55, maxX: tx + 0.55, minZ: tz - 0.55, maxZ: tz + 0.55 });
  }

  // Place Trees at the outer corners and perimeter of the grass field
  createLowPolyTree(cx - hw + 2.0, cz - hd + 2.0); // NW Corner (84, 86)
  createLowPolyTree(cx + hw - 2.0, cz - hd + 2.0); // NE Corner (116, 86)
  createLowPolyTree(cx - hw + 2.0, cz + hd - 2.0); // SW Corner (84, 114)
  createLowPolyTree(cx + hw - 2.0, cz + hd - 2.0); // SE Corner (116, 114)
  createLowPolyTree(cx - hw + 1.5, cz);            // West Outer Edge (83.5, 100)
  createLowPolyTree(cx + hw - 1.5, cz);            // East Outer Edge (116.5, 100)

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

  // 3. Flower Patches Helper: Scatter clusters of spheres (red, yellow, purple, pink) near hedge bases
  const flowerColors = [
    new THREE.MeshLambertMaterial({ color: 0xEF4444 }), // Red
    new THREE.MeshLambertMaterial({ color: 0xFBBF24 }), // Yellow
    new THREE.MeshLambertMaterial({ color: 0xA855F7 }), // Purple
    new THREE.MeshLambertMaterial({ color: 0xEC4899 }), // Pink
    new THREE.MeshLambertMaterial({ color: 0xF97316 })  // Orange
  ];

  function createFlowerPatch(fx, fz) {
    const patchGroup = new THREE.Group();
    patchGroup.position.set(fx, 0, fz);

    // Dark soil mound base
    const bed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.44, 0.04, 8),
      new THREE.MeshLambertMaterial({ color: 0x14532D })
    );
    bed.position.y = 0.02;
    patchGroup.add(bed);

    // 5-6 Spherical Blossoms
    const offsets = [
      { dx: 0, dz: 0, r: 0.14, y: 0.18, cIdx: 0 },
      { dx: 0.18, dz: 0.12, r: 0.11, y: 0.15, cIdx: 1 },
      { dx: -0.16, dz: 0.14, r: 0.12, y: 0.16, cIdx: 2 },
      { dx: 0.14, dz: -0.16, r: 0.11, y: 0.14, cIdx: 3 },
      { dx: -0.15, dz: -0.12, r: 0.13, y: 0.16, cIdx: 4 }
    ];

    offsets.forEach(o => {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(o.r, 6, 6), flowerColors[o.cIdx % flowerColors.length]);
      flower.position.set(o.dx, o.y, o.dz);
      patchGroup.add(flower);
    });

    roomGroup.add(patchGroup);
  }

  // Scatter flower patches along hedge bases and entrance/exit
  createFlowerPatch(84.8, 115.0);
  createFlowerPatch(87.8, 115.0);
  createFlowerPatch(90.5, 102.5);
  createFlowerPatch(95.5, 109.2);
  createFlowerPatch(93.8, 93.0);
  createFlowerPatch(102.5, 93.2);
  createFlowerPatch(106.5, 103.5);
  createFlowerPatch(108.5, 93.0);
  createFlowerPatch(112.5, 87.2);

  // 4. Stepping Stones: Flat grey circular cylinders leading into and out of the maze
  function createSteppingStone(sx, sz) {
    const stone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.44, 0.04, 12),
      new THREE.MeshLambertMaterial({ color: 0xCBD5E1 })
    );
    stone.position.set(sx, 0.025, sz);
    stone.receiveShadow = true;
    roomGroup.add(stone);

    // Stone Bevel Rim
    const stoneRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.02, 12),
      new THREE.MeshLambertMaterial({ color: 0x94A3B8 })
    );
    stoneRim.position.set(sx, 0.015, sz);
    roomGroup.add(stoneRim);
  }

  // Stepping stones leading into the maze entrance (South x=86)
  [117.5, 116.2, 114.9, 113.6, 112.3, 111.0].forEach((sz, idx) => {
    const sxOffset = (idx % 2 === 0) ? -0.15 : 0.15;
    createSteppingStone(86.0 + sxOffset, sz);
  });

  // Stepping stones leading from maze exit towards fountain and smartboard
  [
    [112.0, 93.5],
    [112.8, 91.8],
    [112.2, 90.0],
    [113.5, 88.6],
    [115.0, 88.2]
  ].forEach(([sx, sz]) => {
    createSteppingStone(sx, sz);
  });

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

  // 5. Garden Fountain at the Exit Plaza (2-3 Stacked Cylinders with Shimmering Water)
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(114.5, 0, 88.0);

  // Tier 1 Base Basin
  const fBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.8, 0.42, 18),
    new THREE.MeshLambertMaterial({ color: 0x64748B })
  );
  fBase.position.y = 0.21;
  fBase.castShadow = true;
  fountainGroup.add(fBase);

  // Tier 1 Water Layer
  const fWater1 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.48, 1.48, 0.04, 18),
    new THREE.MeshLambertMaterial({ color: 0x0284C7 })
  );
  fWater1.position.y = 0.40;
  fountainGroup.add(fWater1);

  // Middle Pedestal Pillar
  const fPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 0.65, 12),
    new THREE.MeshLambertMaterial({ color: 0x475569 })
  );
  fPedestal.position.y = 0.72;
  fountainGroup.add(fPedestal);

  // Tier 2 Upper Bowl
  const fBowl2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.65, 0.35, 16),
    new THREE.MeshLambertMaterial({ color: 0x64748B })
  );
  fBowl2.position.y = 1.18;
  fountainGroup.add(fBowl2);

  // Tier 2 Water Layer (Bright Cyan Shimmer)
  const fWater2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.04, 16),
    new THREE.MeshLambertMaterial({ color: 0x38BDF8 })
  );
  fWater2.position.y = 1.35;
  fountainGroup.add(fWater2);

  // Fountain Center Spout / Water Dome
  const fSpout = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xBAE6FD, roughness: 0.2 })
  );
  fSpout.position.y = 1.55;
  fountainGroup.add(fSpout);

  // Soft Blue PointLight Illuminating the Fountain
  const fLight = new THREE.PointLight(0x38BDF8, 1.4, 5.0);
  fLight.position.y = 1.6;
  fountainGroup.add(fLight);

  roomGroup.add(fountainGroup);
  roomColliders.push({ minX: 112.8, maxX: 116.2, minZ: 86.3, maxZ: 89.7 });

  // 6. End of Maze: "Papan Pintar 37 Huruf Jawi" Station (r1AssemblyStation) at (110.0, 88.0)
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
