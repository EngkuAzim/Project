// ==========================================
// ROOMS/ROOM2.JS - Makmal Kata Visual (Classroom at 200, 200) & 2-Session Spawner
// ==========================================
import { createTextCanvasTexture, createTextSprite, createIllustratedCardTexture, buildCutawayRoomShell, resolveRoomArgs } from './helpers.js';

export function buildRoom2(arg1, arg2, arg3) {
  const { targetGroup: roomGroup, collidersList: roomColliders } = resolveRoomArgs(arg1, arg2, arg3);
  const cx = 200, cz = 200;
  buildCutawayRoomShell(roomGroup, roomColliders, cx, cz, 0xF8FAFC, 0x0284C7, 0x0369A1, 0x94A3B8);

  // 1. Front Chalkboard on North Wall
  const boardTex = createTextCanvasTexture(
    'MAKMAL KATA VISUAL JAWI',
    '#065F46',
    '#FFFFFF',
    1024,
    256,
    52,
    'Eja & Padankan 4 Pasangan Kata Menjadi Simpulan Bahasa (DSKP SP 4.4.2)'
  );
  const boardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(14.0, 3.2),
    new THREE.MeshBasicMaterial({ map: boardTex })
  );
  boardMesh.position.set(cx, 3.4, cz - 10.7);
  roomGroup.add(boardMesh);

  // 2. Classroom Wall Clock on North Wall
  const clockGroup = new THREE.Group();
  clockGroup.position.set(cx + 8.5, 4.2, cz - 10.65);
  const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0x1E293B }));
  clockRim.rotation.x = Math.PI / 2;
  clockGroup.add(clockRim);
  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.09, 24), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  clockFace.rotation.x = Math.PI / 2;
  clockGroup.add(clockFace);
  roomGroup.add(clockGroup);

  // 3. Wall Language Charts on West Wall
  [-3.5, 3.5].forEach((wz) => {
    const chartTex = createTextCanvasTexture('PANDUAN EJAAN JAWI', '#1E40AF', '#FEF3C7', 512, 384, 40, 'Huruf Tunggal & Bersambung');
    const chartMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshBasicMaterial({ map: chartTex }));
    chartMesh.position.set(cx - 12.7, 3.0, cz + wz);
    chartMesh.rotation.y = Math.PI / 2;
    roomGroup.add(chartMesh);
  });

  // 4. Teacher's Front Desk
  const teacherDesk = new THREE.Group();
  teacherDesk.position.set(cx - 5.5, 0, cz - 8.2);
  const tTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.6), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  tTop.position.y = 1.0;
  teacherDesk.add(tTop);

  // Laptop
  const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.35), new THREE.MeshStandardMaterial({ color: 0x94A3B8 }));
  laptopBase.position.set(0, 1.09, 0);
  teacherDesk.add(laptopBase);
  const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.03), new THREE.MeshStandardMaterial({ color: 0x1E293B }));
  laptopScreen.position.set(0, 1.25, -0.16);
  laptopScreen.rotation.x = 0.2;
  teacherDesk.add(laptopScreen);

  roomGroup.add(teacherDesk);
  roomColliders.push({ minX: cx - 7.3, maxX: cx - 3.7, minZ: cz - 9.2, maxZ: cz - 7.2 });

  // 5. Classroom Bookshelf (East Corner)
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.4, 0.8), new THREE.MeshLambertMaterial({ color: 0x92400E }));
  shelf.position.set(cx + 9.5, 1.9, cz - 9.8);
  roomGroup.add(shelf);
  roomColliders.push({ minX: cx + 8.0, maxX: cx + 11.0, minZ: cz - 10.4, maxZ: cz - 9.2 });

  // 6. 4 Special Pedestal Desks with Glowing Display Pads (for Collectibles)
  const deskMat = new THREE.MeshLambertMaterial({ color: 0xF1F5F9 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });

  const PEDESTAL_POS = [
    { x: 195.0, z: 196.0, label: 'Meja 1' },
    { x: 205.0, z: 196.0, label: 'Meja 2' },
    { x: 195.0, z: 202.0, label: 'Meja 3' },
    { x: 205.0, z: 202.0, label: 'Meja 4' }
  ];

  PEDESTAL_POS.forEach(({ x, z, label }) => {
    // Student Desk Table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 2.0), deskMat);
    tableTop.position.set(x, 1.0, z);
    tableTop.castShadow = true;
    roomGroup.add(tableTop);

    // Legs
    [[-1.6, -0.8], [1.6, -0.8], [-1.6, 0.8], [1.6, 0.8]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), legMat);
      leg.position.set(x + lx, 0.5, z + lz);
      roomGroup.add(leg);
    });

    // Special Velvet Display Pad with subtle glow on top of table
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.85, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.3 })
    );
    pad.position.set(x, 1.12, z);
    roomGroup.add(pad);

    const padRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.04, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, emissive: 0xF59E0B, emissiveIntensity: 0.7 })
    );
    padRim.rotation.x = Math.PI / 2;
    padRim.position.set(x, 1.15, z);
    roomGroup.add(padRim);

    // Stool chair behind desk
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12), new THREE.MeshLambertMaterial({ color: 0x3B82F6 }));
    stool.position.set(x, 0.3, z + 1.4);
    roomGroup.add(stool);

    roomColliders.push({ minX: x - 2.0, maxX: x + 2.0, minZ: z - 1.2, maxZ: z + 1.2 });
  });

  // 7. Central Interactive Assembly Station (r2AssemblyStation) at (200.0, 194.5)
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

  roomGroup.add(stationGroup);
  roomColliders.push({ minX: 198.0, maxX: 202.0, minZ: 193.5, maxZ: 195.5 });

  return {
    r2AssemblyStation: { group: stationGroup, beacon },
    spawnR2PictureCards
  };
}

/**
 * Spawns an array of 3D Picture Cards into a target THREE.Group
 */
export function spawnR2PictureCards(items, targetGroup) {
  items.forEach((item) => {
    const itemGroup = new THREE.Group();
    itemGroup.position.set(item.pos.x, item.pos.y, item.pos.z);

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

    cardGroup.castShadow = true;
    itemGroup.add(cardGroup);

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
    item.gemMesh = cardGroup;
    item.ringMesh = ring;
    item.pointLight = light;
    item.isPopping = false;
    item.popScale = 1.0;

    targetGroup.add(itemGroup);
  });
}
