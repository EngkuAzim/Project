// ==========================================
// ROOMS/ROOM2.JS - Makmal Kata Visual (Classroom at 200, 200) & 2-Session Spawner
// ==========================================
import { createTextCanvasTexture, createTextSprite, createIllustratedCardTexture, buildCutawayRoomShell, resolveRoomArgs } from './helpers.js';

export function buildRoom2(arg1, arg2, arg3) {
  const { targetGroup: roomGroup, collidersList: roomColliders } = resolveRoomArgs(arg1, arg2, arg3);
  const cx = 200, cz = 200;
  // Neat light blue tile floor with slate-blue grid tiles (GridHelper at y = 0.01)
  buildCutawayRoomShell(roomGroup, roomColliders, cx, cz, 0xE0F2FE, 0x0284C7, 0x0369A1, 0x94A3B8, 26, 22, 0x0284C7, 0x38BDF8);

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

  // 4. Perimeter Wall Furniture: Teacher's Front Desk along North Wall
  const teacherDesk = new THREE.Group();
  teacherDesk.position.set(cx - 6.5, 0, cz - 9.2);
  const tTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.4), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  tTop.position.y = 0.85;
  teacherDesk.add(tTop);

  const tBase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.78, 1.2), new THREE.MeshLambertMaterial({ color: 0x92400E }));
  tBase.position.y = 0.39;
  teacherDesk.add(tBase);

  // Laptop on Teacher Desk
  const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.35), new THREE.MeshStandardMaterial({ color: 0x94A3B8 }));
  laptopBase.position.set(0, 0.94, 0);
  teacherDesk.add(laptopBase);
  const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.03), new THREE.MeshStandardMaterial({ color: 0x1E293B }));
  laptopScreen.position.set(0, 1.1, -0.16);
  laptopScreen.rotation.x = 0.2;
  teacherDesk.add(laptopScreen);

  roomGroup.add(teacherDesk);
  roomColliders.push({ minX: cx - 8.3, maxX: cx - 4.7, minZ: cz - 10.0, maxZ: cz - 8.3 });

  // 5. Perimeter Wall Furniture: Bookshelf along West Wall
  const westShelf = new THREE.Group();
  westShelf.position.set(cx - 11.8, 0, cz - 2.0);
  const sFrame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 3.0), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  sFrame.position.y = 1.6;
  westShelf.add(sFrame);

  const bookMat1 = new THREE.MeshLambertMaterial({ color: 0xDC2626 });
  const bookMat2 = new THREE.MeshLambertMaterial({ color: 0x2563EB });
  for (let b = 0; b < 3; b++) {
    const row = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 2.6), (b % 2 === 0) ? bookMat1 : bookMat2);
    row.position.set(0.05, 0.75 + b * 0.9, 0);
    westShelf.add(row);
  }
  roomGroup.add(westShelf);
  roomColliders.push({ minX: cx - 12.6, maxX: cx - 11.0, minZ: cz - 3.8, maxZ: cz - 0.2 });

  // 6. Perimeter Wall Furniture: Storage Cubby Lockers along East Wall
  const eastCubby = new THREE.Group();
  eastCubby.position.set(cx + 11.8, 0, cz + 2.0);
  const cubbyBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 3.2), new THREE.MeshLambertMaterial({ color: 0xB45309 }));
  cubbyBody.position.y = 1.1;
  eastCubby.add(cubbyBody);
  roomGroup.add(eastCubby);
  roomColliders.push({ minX: cx + 11.0, maxX: cx + 12.6, minZ: cz + 0.2, maxZ: cz + 3.8 });

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

    // Glowing point light
    const light = new THREE.PointLight(item.color, 1.5, 5);
    itemGroup.add(light);

    item.mesh = itemGroup;
    item.gemMesh = cardGroup;
    item.ringMesh = null;
    item.pointLight = light;
    item.isPopping = false;
    item.popScale = 1.0;

    targetGroup.add(itemGroup);
  });
}
