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
    'Eja & Padankan 4 Pasangan Kata Menjadi Simpulan Bahasa'
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

  // 8. Student Desks & Chairs (4 Sets in Left and Right Center Space)
  const ceilingFans = [];

  function createStudentDeskSet(dx, dz, rotY = 0) {
    const setGroup = new THREE.Group();
    setGroup.position.set(dx, 0, dz);
    setGroup.rotation.y = rotY;

    const deskTopMat = new THREE.MeshLambertMaterial({ color: 0xC19A6B });
    const metalLegMat = new THREE.MeshLambertMaterial({ color: 0x64748B });
    const chairBlueMat = new THREE.MeshLambertMaterial({ color: 0x2563EB });

    // A. Desk Tabletop
    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.0), deskTopMat);
    tabletop.position.y = 0.85;
    tabletop.castShadow = true;
    setGroup.add(tabletop);

    // Book storage cubby shelf under tabletop
    const underShelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.85), metalLegMat);
    underShelf.position.y = 0.65;
    setGroup.add(underShelf);

    // 4 Desk Legs
    const deskLegOffsets = [
      [-0.7, 0.4],
      [0.7, 0.4],
      [-0.7, -0.4],
      [0.7, -0.4]
    ];
    deskLegOffsets.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.81, 8), metalLegMat);
      leg.position.set(lx, 0.405, lz);
      setGroup.add(leg);
    });

    // B. Open Book on Tabletop
    const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.02, 0.48), new THREE.MeshLambertMaterial({ color: 0x1D4ED8 }));
    bookCover.position.set(0, 0.895, 0);
    setGroup.add(bookCover);

    const pageMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    // Left open page
    const pageL = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.44), pageMat);
    pageL.rotation.x = -Math.PI / 2;
    pageL.rotation.y = 0.06;
    pageL.position.set(-0.16, 0.91, 0);
    setGroup.add(pageL);

    // Right open page
    const pageR = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.44), pageMat);
    pageR.rotation.x = -Math.PI / 2;
    pageR.rotation.y = -0.06;
    pageR.position.set(0.16, 0.91, 0);
    setGroup.add(pageR);

    // Pencil
    const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), new THREE.MeshLambertMaterial({ color: 0xF59E0B }));
    pencil.position.set(0.48, 0.90, 0.12);
    pencil.rotation.z = 1.2;
    setGroup.add(pencil);

    // C. Student Blue Chair (Tucked neatly behind desk)
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0.65);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.7), chairBlueMat);
    seat.position.y = 0.48;
    chairGroup.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.06), chairBlueMat);
    backrest.position.set(0, 0.76, 0.32);
    chairGroup.add(backrest);

    // 4 Chair Legs
    const chairLegOffsets = [
      [-0.28, 0.28],
      [0.28, 0.28],
      [-0.28, -0.28],
      [0.28, -0.28]
    ];
    chairLegOffsets.forEach(([cxPos, czPos]) => {
      const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.05), metalLegMat);
      cLeg.position.set(cxPos, 0.24, czPos);
      chairGroup.add(cLeg);
    });

    setGroup.add(chairGroup);
    roomGroup.add(setGroup);

    roomColliders.push({
      minX: dx - 0.95,
      maxX: dx + 0.95,
      minZ: dz - 0.65,
      maxZ: dz + 1.15
    });
  }

  // 4 Sets of Student Desks: 2 on Left, 2 on Right
  createStudentDeskSet(cx - 7.5, cz - 2.5); // Left Front Desk
  createStudentDeskSet(cx - 7.5, cz + 3.5); // Left Back Desk
  createStudentDeskSet(cx + 7.5, cz - 2.5); // Right Front Desk
  createStudentDeskSet(cx + 7.5, cz + 3.5); // Right Back Desk

  // 9. Educational Wall Posters (Yellow, Cyan, Light Green)
  // Poster 1: "JADUAL BERTUGAS" (East Wall)
  const poster1Tex = createTextCanvasTexture(
    'JADUAL BERTUGAS 4 INOVATIF',
    '#FEF08A',
    '#78350F',
    512,
    384,
    38,
    'Kebersihan • Disiplin • Papan Tulis'
  );
  const poster1 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), new THREE.MeshBasicMaterial({ map: poster1Tex }));
  poster1.position.set(cx + 12.7, 3.2, cz - 4.0);
  poster1.rotation.y = -Math.PI / 2;
  roomGroup.add(poster1);

  // Poster 2: "PIRAMID MAKANAN SEIMBANG" (East Wall)
  const poster2Tex = createTextCanvasTexture(
    'PIRAMID MAKANAN SEIMBANG',
    '#BAE6FD',
    '#0369A1',
    512,
    384,
    38,
    'Gaya Hidup Sihat • Murid Cergas'
  );
  const poster2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), new THREE.MeshBasicMaterial({ map: poster2Tex }));
  poster2.position.set(cx + 12.7, 3.2, cz + 5.5);
  poster2.rotation.y = -Math.PI / 2;
  roomGroup.add(poster2);

  // Poster 3: "PERATURAN MAKMAL KATA" (North Wall)
  const poster3Tex = createTextCanvasTexture(
    'PERATURAN MAKMAL KATA',
    '#BBF7D0',
    '#14532D',
    512,
    384,
    38,
    'Sedia Belajar • Hormati Guru'
  );
  const poster3 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), new THREE.MeshBasicMaterial({ map: poster3Tex }));
  poster3.position.set(cx - 10.0, 3.2, cz - 10.7);
  roomGroup.add(poster3);

  // 10. Ceiling Fans: 2 fans hanging from top
  function createCeilingFan(fx, fz) {
    const fanGroup = new THREE.Group();
    fanGroup.position.set(fx, 0, fz);

    // Vertical mounting pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8),
      new THREE.MeshLambertMaterial({ color: 0x64748B })
    );
    pole.position.y = 5.05;
    fanGroup.add(pole);

    // Motor housing
    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.22, 16),
      new THREE.MeshLambertMaterial({ color: 0x334155 })
    );
    motor.position.y = 4.6;
    fanGroup.add(motor);

    // Spinning Blade Assembly
    const bladesHub = new THREE.Group();
    bladesHub.position.y = 4.58;

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const bladeArm = new THREE.Group();
      bladeArm.rotation.y = angle;

      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.02, 0.22),
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
      );
      blade.position.set(0.85, 0, 0);
      blade.rotation.z = 0.08;
      bladeArm.add(blade);
      bladesHub.add(bladeArm);
    }

    fanGroup.add(bladesHub);
    roomGroup.add(fanGroup);
    ceilingFans.push(bladesHub);
  }

  createCeilingFan(cx - 5.0, cz); // Left Ceiling Fan
  createCeilingFan(cx + 5.0, cz); // Right Ceiling Fan

  // 11. Recycling Bins (Blue: Paper, Brown: Glass, Orange: Plastic) Near Entrance
  const binColors = [
    { name: 'Kertas (Paper)', color: 0x2563EB, rimColor: 0x1D4ED8, xOffset: 206.0 },
    { name: 'Kaca (Glass)', color: 0x92400E, rimColor: 0x78350F, xOffset: 207.0 },
    { name: 'Plastik (Plastic)', color: 0xEA580C, rimColor: 0xC2410C, xOffset: 208.0 }
  ];

  binColors.forEach((b) => {
    const binGroup = new THREE.Group();
    binGroup.position.set(b.xOffset, 0, cz + 9.6);

    // Tapered Cylinder Bin Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.26, 0.85, 14),
      new THREE.MeshLambertMaterial({ color: b.color })
    );
    body.position.y = 0.425;
    body.castShadow = true;
    binGroup.add(body);

    // Lid Rim
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.08, 14),
      new THREE.MeshLambertMaterial({ color: b.rimColor })
    );
    rim.position.y = 0.88;
    binGroup.add(rim);

    // Drop Slot Top Flap
    const flap = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.04, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x1E293B })
    );
    flap.position.set(0, 0.94, 0);
    binGroup.add(flap);

    roomGroup.add(binGroup);
  });

  roomColliders.push({ minX: 205.4, maxX: 208.6, minZ: cz + 9.0, maxZ: cz + 10.2 });

  return {
    r2AssemblyStation: { group: stationGroup, beacon },
    ceilingFans,
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
