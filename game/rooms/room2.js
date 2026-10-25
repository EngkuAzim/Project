// ==========================================
// ROOMS/ROOM2.JS - Makmal Kata Visual (Classroom at 200, 200) & 2-Session Spawner
// ==========================================
import { createTextCanvasTexture, createTextSprite, createIllustratedCardTexture, buildCutawayRoomShell, resolveRoomArgs } from './helpers.js';

export function buildRoom2(arg1, arg2, arg3) {
  const { targetGroup: roomGroup, collidersList: roomColliders } = resolveRoomArgs(arg1, arg2, arg3);
  const cx = 200, cz = 200;
  // Neat light blue tile floor with slate-blue grid tiles (GridHelper at y = 0.01)
  buildCutawayRoomShell(roomGroup, roomColliders, cx, cz, 0xE0F2FE, 0x0284C7, 0x0369A1, 0x94A3B8, 26, 22, 0x0284C7, 0x38BDF8);

  // 1. Flooring Zoning: Front Stage & Left/Right Aisle Runners (For 3x3 Student Desk Layout)
  // A. Front Teacher Stage (Elevated wooden/slate blue platform at North wall)
  const stageMesh = new THREE.Mesh(
    new THREE.BoxGeometry(16.0, 0.08, 3.8),
    new THREE.MeshLambertMaterial({ color: 0x0369A1 })
  );
  stageMesh.position.set(cx, 0.04, cz - 9.0);
  roomGroup.add(stageMesh);

  // Front stage gold trim strip
  const stageTrim = new THREE.Mesh(
    new THREE.BoxGeometry(16.0, 0.09, 0.1),
    new THREE.MeshLambertMaterial({ color: 0xF59E0B })
  );
  stageTrim.position.set(cx, 0.045, cz - 7.05);
  roomGroup.add(stageTrim);

  // B. Left & Right Classroom Aisle Runners (between the 3 desk columns)
  function createAisleRunner(rx) {
    const border = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 14.5),
      new THREE.MeshLambertMaterial({ color: 0xF59E0B, side: THREE.DoubleSide })
    );
    border.rotation.x = -Math.PI / 2;
    border.position.set(rx, 0.015, cz + 1.5);
    roomGroup.add(border);

    const runner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 14.3),
      new THREE.MeshLambertMaterial({ color: 0x0284C7, side: THREE.DoubleSide })
    );
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(rx, 0.02, cz + 1.5);
    roomGroup.add(runner);
  }

  createAisleRunner(cx - 2.5); // Left aisle between Column 1 & Column 2 (x = 197.5)
  createAisleRunner(cx + 2.5); // Right aisle between Column 2 & Column 3 (x = 202.5)

  // C. Front Cross-Aisle Runner (along the front of student desks)
  const frontCrossBorder = new THREE.Mesh(
    new THREE.PlaneGeometry(15.0, 1.6),
    new THREE.MeshLambertMaterial({ color: 0xF59E0B, side: THREE.DoubleSide })
  );
  frontCrossBorder.rotation.x = -Math.PI / 2;
  frontCrossBorder.position.set(cx, 0.015, cz - 5.5);
  roomGroup.add(frontCrossBorder);

  const frontCrossRunner = new THREE.Mesh(
    new THREE.PlaneGeometry(14.8, 1.4),
    new THREE.MeshLambertMaterial({ color: 0x0284C7, side: THREE.DoubleSide })
  );
  frontCrossRunner.rotation.x = -Math.PI / 2;
  frontCrossRunner.position.set(cx, 0.02, cz - 5.5);
  roomGroup.add(frontCrossRunner);

  // 2. Front Chalkboard on North Wall
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

  // Chalkboard wooden frame rim
  const boardRim = new THREE.Mesh(
    new THREE.BoxGeometry(14.3, 3.4, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  boardRim.position.set(cx, 3.4, cz - 10.76);
  roomGroup.add(boardRim);

  // Chalk ledge at bottom of board
  const chalkLedge = new THREE.Mesh(
    new THREE.BoxGeometry(14.2, 0.08, 0.25),
    new THREE.MeshLambertMaterial({ color: 0x92400E })
  );
  chalkLedge.position.set(cx, 1.76, cz - 10.65);
  roomGroup.add(chalkLedge);

  // White chalkboard eraser and colored chalk sticks
  const eraser = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.12), new THREE.MeshLambertMaterial({ color: 0x334155 }));
  eraser.position.set(cx - 2.5, 1.83, cz - 10.65);
  roomGroup.add(eraser);

  const chalk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6), new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
  chalk1.rotation.z = Math.PI / 2;
  chalk1.position.set(cx - 1.8, 1.82, cz - 10.65);
  roomGroup.add(chalk1);

  const chalk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6), new THREE.MeshLambertMaterial({ color: 0xFDE047 }));
  chalk2.rotation.z = Math.PI / 2;
  chalk2.position.set(cx - 1.6, 1.82, cz - 10.65);
  roomGroup.add(chalk2);

  // 3. Classroom Wall Clock on North Wall
  const clockGroup = new THREE.Group();
  clockGroup.position.set(cx + 8.5, 4.2, cz - 10.65);
  const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0x1E293B }));
  clockRim.rotation.x = Math.PI / 2;
  clockGroup.add(clockRim);
  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.09, 24), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  clockFace.rotation.x = Math.PI / 2;
  clockGroup.add(clockFace);
  roomGroup.add(clockGroup);

  // 4. Windows on West Wall (Sunlight & Outdoor View Simulation)
  function buildWindow(width, height) {
    const winGroup = new THREE.Group();
    // Wooden Outer Frame
    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.2, height + 0.2, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x78350F })
    );
    winGroup.add(frameMesh);

    // Light Blue Sky Glass Pane
    const glassMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color: 0xBAE6FD, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    glassMesh.position.z = 0.02;
    winGroup.add(glassMesh);

    // Wooden Crossbars (Vertical & Horizontal Louvers)
    const vertBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, height, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x92400E })
    );
    vertBar.position.z = 0.04;
    winGroup.add(vertBar);

    [-height * 0.25, height * 0.25].forEach((ly) => {
      const hBar = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.06, 0.08),
        new THREE.MeshLambertMaterial({ color: 0x92400E })
      );
      hBar.position.set(0, ly, 0.04);
      winGroup.add(hBar);
    });

    // Window Sill
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.35, 0.1, 0.25),
      new THREE.MeshLambertMaterial({ color: 0x592911 })
    );
    sill.position.set(0, -height / 2 - 0.05, 0.08);
    winGroup.add(sill);

    return winGroup;
  }

  // Two Windows on West Wall
  const winWestNorth = buildWindow(2.4, 2.1);
  winWestNorth.rotation.y = Math.PI / 2;
  winWestNorth.position.set(cx - 12.7, 3.3, cz - 7.0);
  roomGroup.add(winWestNorth);

  const winWestSouth = buildWindow(2.4, 2.1);
  winWestSouth.rotation.y = Math.PI / 2;
  winWestSouth.position.set(cx - 12.7, 3.3, cz + 7.0);
  roomGroup.add(winWestSouth);

  // Wall Language Charts on West Wall (between windows and bookshelf)
  const chartTex = createTextCanvasTexture('PANDUAN EJAAN JAWI', '#1E40AF', '#FEF3C7', 512, 384, 40, 'Huruf Tunggal & Bersambung');
  const chartMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshBasicMaterial({ map: chartTex }));
  chartMesh.position.set(cx - 12.7, 3.0, cz + 3.2);
  chartMesh.rotation.y = Math.PI / 2;
  roomGroup.add(chartMesh);

  // 5. Perimeter Furniture: Bookshelf along West Wall
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

  // 6. Perimeter Furniture: Storage Cubby Lockers along East Wall
  const eastCubby = new THREE.Group();
  eastCubby.position.set(cx + 11.8, 0, cz + 2.0);
  const cubbyBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 3.2), new THREE.MeshLambertMaterial({ color: 0xB45309 }));
  cubbyBody.position.y = 1.1;
  eastCubby.add(cubbyBody);
  roomGroup.add(eastCubby);
  roomColliders.push({ minX: cx + 11.0, maxX: cx + 12.6, minZ: cz + 0.2, maxZ: cz + 3.8 });

  // 7. East Wall Student Work Showcase Corkboard ("Sudut Hasil Kerja Murid")
  const showcaseGroup = new THREE.Group();
  showcaseGroup.position.set(cx + 12.65, 3.2, cz - 0.8);
  showcaseGroup.rotation.y = -Math.PI / 2;

  // Rich wooden corkboard frame
  const boardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 2.4, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  showcaseGroup.add(boardFrame);

  // Warm corkboard backing surface
  const corkSurface = new THREE.Mesh(
    new THREE.BoxGeometry(5.0, 2.2, 0.11),
    new THREE.MeshLambertMaterial({ color: 0xD97706 })
  );
  showcaseGroup.add(corkSurface);

  // Top banner label: "SUDUT KARYA CEMERLANG 4 INOVATIF"
  const bannerTex = createTextCanvasTexture('SUDUT KARYA CEMERLANG 4 INOVATIF', '#0F172A', '#FEF08A', 512, 128, 34, 'Tulisan Jawi & Simpulan Bahasa');
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 0.48), new THREE.MeshBasicMaterial({ map: bannerTex }));
  bannerMesh.position.set(0, 0.82, 0.07);
  showcaseGroup.add(bannerMesh);

  // 4 Pinned Student Project Cards
  const studentWorks = [
    { name: 'Karya: Aminah', text: 'اولت بوکو ⭐⭐⭐', bg: '#ECFDF5', fg: '#065F46', pinColor: 0xEF4444, xPos: -1.75 },
    { name: 'Karya: Harith', text: 'انق امس ⭐⭐⭐', bg: '#FEF3C7', fg: '#78350F', pinColor: 0x3B82F6, xPos: -0.58 },
    { name: 'Karya: Siti', text: 'بواه هاتي ⭐⭐⭐', bg: '#EFF6FF', fg: '#1E40AF', pinColor: 0x10B981, xPos: 0.58 },
    { name: 'Karya: Ziyad', text: 'چهاي مات ⭐⭐⭐', bg: '#FDF2F8', fg: '#831843', pinColor: 0xF59E0B, xPos: 1.75 }
  ];

  studentWorks.forEach(w => {
    const cardTex = createTextCanvasTexture(w.name, w.bg, w.fg, 256, 256, 28, w.text);
    const cardMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.15), new THREE.MeshBasicMaterial({ map: cardTex }));
    cardMesh.position.set(w.xPos, -0.15, 0.07);
    showcaseGroup.add(cardMesh);

    // Colored push-pin stud on top of the card
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8), new THREE.MeshLambertMaterial({ color: w.pinColor }));
    pin.rotation.x = Math.PI / 2;
    pin.position.set(w.xPos, 0.42, 0.1);
    showcaseGroup.add(pin);
  });

  roomGroup.add(showcaseGroup);

  // 8. Teacher's Desk (Meja Guru) Centered on the Front Stage - Interactive Station
  const teacherDesk = new THREE.Group();
  teacherDesk.position.set(cx, 0, cz - 9.0);

  const tTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 1.4), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  tTop.position.y = 0.85;
  teacherDesk.add(tTop);

  const tBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.78, 1.2), new THREE.MeshLambertMaterial({ color: 0x92400E }));
  tBase.position.y = 0.39;
  teacherDesk.add(tBase);

  // Laptop on Teacher Desk
  const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.35), new THREE.MeshStandardMaterial({ color: 0x94A3B8 }));
  laptopBase.position.set(-0.6, 0.94, 0);
  teacherDesk.add(laptopBase);
  const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.03), new THREE.MeshStandardMaterial({ color: 0x1E293B }));
  laptopScreen.position.set(-0.6, 1.1, -0.16);
  laptopScreen.rotation.x = 0.2;
  teacherDesk.add(laptopScreen);

  // Stack of marked student exercise books on Teacher Desk
  const bookColors = [0xEF4444, 0x3B82F6, 0x10B981];
  bookColors.forEach((bColor, bIdx) => {
    const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.32), new THREE.MeshLambertMaterial({ color: bColor }));
    bookMesh.position.set(0.65, 0.94 + bIdx * 0.038, -0.05);
    bookMesh.rotation.y = (bIdx - 1) * 0.08;
    teacherDesk.add(bookMesh);
  });

  // Teacher's blue water tumbler / flask
  const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 12), new THREE.MeshLambertMaterial({ color: 0x0284C7 }));
  tumbler.position.set(1.25, 1.05, 0.2);
  teacherDesk.add(tumbler);
  const tumblerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.06, 12), new THREE.MeshLambertMaterial({ color: 0x0F172A }));
  tumblerCap.position.set(1.25, 1.2, 0.2);
  teacherDesk.add(tumblerCap);

  // Teacher's Ergonomic Office Swivel Chair behind Teacher Desk
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, -0.85);

  const tChairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.7), new THREE.MeshLambertMaterial({ color: 0x1E293B }));
  tChairSeat.position.y = 0.52;
  chairGroup.add(tChairSeat);

  const tChairBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.72, 0.1), new THREE.MeshLambertMaterial({ color: 0x1E293B }));
  tChairBack.position.set(0, 0.92, -0.32);
  tChairBack.rotation.x = 0.08;
  chairGroup.add(tChairBack);

  const tChairStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.46, 10), new THREE.MeshLambertMaterial({ color: 0x64748B }));
  tChairStem.position.y = 0.25;
  chairGroup.add(tChairStem);

  const tChairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 5), new THREE.MeshLambertMaterial({ color: 0x334155 }));
  tChairBase.position.y = 0.05;
  chairGroup.add(tChairBase);

  teacherDesk.add(chairGroup);

  // Interactive Beacon mounted directly on the Teacher Desk
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.38, 0),
    new THREE.MeshStandardMaterial({ color: 0x06D6A0, emissive: 0x06D6A0, emissiveIntensity: 0.9 })
  );
  beacon.position.set(0, 2.2, 0.15);
  teacherDesk.add(beacon);

  const bLight = new THREE.PointLight(0x06D6A0, 1.8, 5);
  bLight.position.set(0, 2.2, 0.15);
  teacherDesk.add(bLight);

  roomGroup.add(teacherDesk);
  roomColliders.push({ minX: cx - 2.0, maxX: cx + 2.0, minZ: cz - 10.2, maxZ: cz - 8.1 });

  // 9. 3x3 Student Desks & Chairs (9 Sets Arranged in 3 Rows x 3 Columns)
  const ceilingFans = [];

  function createStudentDeskSet(dx, dz, rotY = 0) {
    const setGroup = new THREE.Group();
    setGroup.position.set(dx, 0, dz);
    setGroup.rotation.y = rotY;

    const deskTopMat = new THREE.MeshLambertMaterial({ color: 0xC19A6B });
    const metalLegMat = new THREE.MeshLambertMaterial({ color: 0x64748B });
    const chairBlueMat = new THREE.MeshLambertMaterial({ color: 0x2563EB });

    // A. Desk Tabletop
    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.9), deskTopMat);
    tabletop.position.y = 0.85;
    tabletop.castShadow = true;
    setGroup.add(tabletop);

    // Book storage cubby shelf under tabletop
    const underShelf = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.75), metalLegMat);
    underShelf.position.y = 0.65;
    setGroup.add(underShelf);

    // 4 Desk Legs
    const deskLegOffsets = [
      [-0.65, 0.35],
      [0.65, 0.35],
      [-0.65, -0.35],
      [0.65, -0.35]
    ];
    deskLegOffsets.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.81, 8), metalLegMat);
      leg.position.set(lx, 0.405, lz);
      setGroup.add(leg);
    });

    // B. Open Book on Tabletop
    const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.02, 0.44), new THREE.MeshLambertMaterial({ color: 0x1D4ED8 }));
    bookCover.position.set(0, 0.895, 0);
    setGroup.add(bookCover);

    const pageMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    // Left open page
    const pageL = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.40), pageMat);
    pageL.rotation.x = -Math.PI / 2;
    pageL.rotation.y = 0.06;
    pageL.position.set(-0.15, 0.91, 0);
    setGroup.add(pageL);

    // Right open page
    const pageR = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.40), pageMat);
    pageR.rotation.x = -Math.PI / 2;
    pageR.rotation.y = -0.06;
    pageR.position.set(0.15, 0.91, 0);
    setGroup.add(pageR);

    // Pencil
    const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), new THREE.MeshLambertMaterial({ color: 0xF59E0B }));
    pencil.position.set(0.44, 0.90, 0.12);
    pencil.rotation.z = 1.2;
    setGroup.add(pencil);

    // C. Student Blue Chair (Tucked neatly behind desk)
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0.6);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.65), chairBlueMat);
    seat.position.y = 0.48;
    chairGroup.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.40, 0.06), chairBlueMat);
    backrest.position.set(0, 0.74, 0.30);
    chairGroup.add(backrest);

    // 4 Chair Legs
    const chairLegOffsets = [
      [-0.26, 0.26],
      [0.26, 0.26],
      [-0.26, -0.26],
      [0.26, -0.26]
    ];
    chairLegOffsets.forEach(([cxPos, czPos]) => {
      const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.48, 0.045), metalLegMat);
      cLeg.position.set(cxPos, 0.24, czPos);
      chairGroup.add(cLeg);
    });

    setGroup.add(chairGroup);
    roomGroup.add(setGroup);

    roomColliders.push({
      minX: dx - 0.85,
      maxX: dx + 0.85,
      minZ: dz - 0.55,
      maxZ: dz + 1.05
    });
  }

  // 3x3 Grid of Student Desks (3 Columns x 3 Rows)
  const colXs = [cx - 5.0, cx, cx + 5.0];       // x = 195.0, 200.0, 205.0
  const rowZs = [cz - 4.0, cz + 2.0, cz + 7.0];  // z = 196.0, 202.0, 207.0

  colXs.forEach(dx => {
    rowZs.forEach(dz => {
      createStudentDeskSet(dx, dz);
    });
  });

  // 10. Educational Wall Posters
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
  poster1.position.set(cx + 12.7, 3.2, cz - 4.5);
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

  // 11. Corner Indoor Potted Classroom Plants
  function createPottedPlant(px, pz) {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(px, 0, pz);

    // Ceramic White Pot
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.3, 0.75, 14),
      new THREE.MeshLambertMaterial({ color: 0xF8FAFC })
    );
    pot.position.y = 0.375;
    pot.castShadow = true;
    plantGroup.add(pot);

    // Pot Rim
    const potRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.08, 14),
      new THREE.MeshLambertMaterial({ color: 0xE2E8F0 })
    );
    potRim.position.y = 0.75;
    plantGroup.add(potRim);

    // Soil
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.06, 12),
      new THREE.MeshLambertMaterial({ color: 0x451A03 })
    );
    soil.position.y = 0.74;
    plantGroup.add(soil);

    // Foliage Spheres
    const foliageMat1 = new THREE.MeshLambertMaterial({ color: 0x15803D });
    const foliageMat2 = new THREE.MeshLambertMaterial({ color: 0x16A34A });
    const foliageMat3 = new THREE.MeshLambertMaterial({ color: 0x22C55E });

    const centerBush = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), foliageMat1);
    centerBush.position.y = 1.05;
    plantGroup.add(centerBush);

    const bushClusters = [
      { x: 0.22, y: 1.15, z: 0.12, r: 0.32, mat: foliageMat2 },
      { x: -0.22, y: 1.18, z: -0.14, r: 0.34, mat: foliageMat3 },
      { x: 0.12, y: 1.25, z: -0.22, r: 0.30, mat: foliageMat1 },
      { x: -0.15, y: 1.32, z: 0.18, r: 0.28, mat: foliageMat2 }
    ];

    bushClusters.forEach((c) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(c.r, 8, 8), c.mat);
      b.position.set(c.x, c.y, c.z);
      plantGroup.add(b);
    });

    roomGroup.add(plantGroup);
    roomColliders.push({ minX: px - 0.55, maxX: px + 0.55, minZ: pz - 0.55, maxZ: pz + 0.55 });
  }

  // 2 Potted Plants (North-East corner and South-West corner)
  createPottedPlant(cx + 11.2, cz - 9.2); // NE Corner near clock
  createPottedPlant(cx - 11.2, cz + 8.8); // SW Corner near entrance

  // 12. Ceiling Pendant Lamps (4 Warm Hanging Spheres)
  const pendantCoords = [
    [-6.0, -4.5],
    [6.0, -4.5],
    [-6.0, 4.5],
    [6.0, 4.5]
  ];

  pendantCoords.forEach(([lx, lz]) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(cx + lx, 0, cz + lz);

    // Suspension cord
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8),
      new THREE.MeshLambertMaterial({ color: 0x334155 })
    );
    cord.position.y = 4.9;
    lampGroup.add(cord);

    // Bronze conical lampshade
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.34, 0.22, 16),
      new THREE.MeshLambertMaterial({ color: 0x78350F })
    );
    shade.position.y = 4.3;
    lampGroup.add(shade);

    // Glowing warm bulb
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xFFFBEB })
    );
    bulb.position.y = 4.18;
    lampGroup.add(bulb);

    // Soft warm point light
    const lampLight = new THREE.PointLight(0xFFEDD5, 0.85, 7.5);
    lampLight.position.y = 4.15;
    lampGroup.add(lampLight);

    roomGroup.add(lampGroup);
  });

  // 13. Ceiling Fans: 2 fans hanging from top
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

  // 14. Recycling Bins (Blue: Paper, Brown: Glass, Orange: Plastic) Near Entrance
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
    r2AssemblyStation: { group: teacherDesk, beacon },
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
