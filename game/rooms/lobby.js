// ==========================================
// ROOMS/LOBBY.JS - Dataran Perhimpunan Sekolah Bestari (Lobby at 0, 0)
// ==========================================
import { createTextCanvasTexture, createNoticeboardTexture, createTextSprite, buildCutawayRoomShell, resolveRoomArgs } from './helpers.js';
 
export function buildLobby(arg1, arg2, arg3) {
  const { targetGroup: roomGroup, collidersList: roomColliders } = resolveRoomArgs(arg1, arg2, arg3);
  const cx = 0, cz = 0;
  // Warm wooden floor with amber grid tiles (GridHelper at y = 0.01)
  buildCutawayRoomShell(roomGroup, roomColliders, cx, cz, 0xC19A6B, 0x1E3A8A, 0x1E40AF, 0x78350F, 26, 22, 0x92400E, 0xB45309);

  // 1. School Hall Arch & Facade Banner on North Wall (Perfect 4:1 Aspect Ratio without clipping)
  const bannerTex = createTextCanvasTexture(
    'JEJAK JAWI BESTARI',
    '#1E3A8A',
    '#FFFFFF',
    1280,
    320,
    52,
    'Inovasi Digital PdP Seni Tulisan Jawi • Sekolah Bestari'
  );

  // Backing wooden board frame
  const boardBacking = new THREE.Mesh(
    new THREE.BoxGeometry(16.4, 4.2, 0.2),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  boardBacking.position.set(cx, 3.6, cz - 10.75);
  roomGroup.add(boardBacking);

  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(16.0, 4.0),
    new THREE.MeshBasicMaterial({ map: bannerTex })
  );
  bannerMesh.position.set(cx, 3.6, cz - 10.63);
  roomGroup.add(bannerMesh);

  // 2. Jalur Gemilang Flagpole with Raised Stone Base (Neatly positioned near wall)
  const poleBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), new THREE.MeshLambertMaterial({ color: 0xCBD5E1 }));
  poleBase.position.set(-8.5, 0.25, -7.5);
  roomGroup.add(poleBase);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7.5, 12), new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.8 }));
  pole.position.set(-8.5, 3.8, -7.5);
  roomGroup.add(pole);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.04), new THREE.MeshLambertMaterial({ color: 0xDC2626 }));
  flag.position.set(-7.5, 6.7, -7.5);
  roomGroup.add(flag);

  roomColliders.push({ minX: -9.5, maxX: -7.5, minZ: -8.5, maxZ: -6.5 });

  // 3. Red Ceremonial Carpet Leading Across Dataran (Sitting smoothly above grid at y = 0.02)
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 16.0),
    new THREE.MeshLambertMaterial({ color: 0x991B1B })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.02, 1.0);
  roomGroup.add(carpet);

  // 4. School Noticeboard with Announcement (Enlarged Full Stand against West Wall)
  const noticeboard = new THREE.Group();
  noticeboard.position.set(-9.2, 0, -1.0);
  noticeboard.rotation.y = Math.PI / 2 - 0.22; // Angled cleanly towards the walkway

  // Main board frame
  const nBoardMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 0.22), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  nBoardMesh.position.y = 2.1;
  noticeboard.add(nBoardMesh);

  // Roof awning / cap
  const nRoofMesh = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.16, 0.4), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
  nRoofMesh.position.y = 3.45;
  noticeboard.add(nRoofMesh);

  // Left & right supporting posts
  [-1.85, 1.85].forEach((postX) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), new THREE.MeshLambertMaterial({ color: 0x451A03 }));
    post.position.set(postX, 1.1, 0);
    noticeboard.add(post);
  });

  // High-resolution full noticeboard canvas texture
  const nTex = createNoticeboardTexture();
  const nFace = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 2.3), new THREE.MeshBasicMaterial({ map: nTex }));
  nFace.position.set(0, 2.1, 0.12);
  noticeboard.add(nFace);

  roomGroup.add(noticeboard);
  roomColliders.push({ minX: -10.5, maxX: -7.8, minZ: -3.2, maxZ: 1.2 });

  // 5. NPC Cikgu Asyikin (Guru Bahasa Melayu) - Bertudung Bawal & Berkaca Mata
  const teacherGroup = new THREE.Group();
  teacherGroup.position.set(2.0, 0, -3.2);

  // A. Kasut Hitam Wanita (Black Court Shoes)
  const shoeMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.22), shoeMat);
  shoeL.position.set(-0.15, 0.035, 0.05);
  teacherGroup.add(shoeL);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.22), shoeMat);
  shoeR.position.set(0.15, 0.035, 0.05);
  teacherGroup.add(shoeR);

  // B. Kain / Skirt Labuh Baju Kurung (Emerald Green)
  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.52, 0.95, 16),
    new THREE.MeshLambertMaterial({ color: 0x047857 })
  );
  skirt.position.y = 0.52;
  teacherGroup.add(skirt);

  // Jalur Emas Hujung Kain
  const skirtTrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.51, 0.525, 0.04, 16),
    new THREE.MeshLambertMaterial({ color: 0xF59E0B })
  );
  skirtTrim.position.y = 0.06;
  teacherGroup.add(skirtTrim);

  // C. Baju Kurung Moden (Emerald Green Kurung Blouse)
  const bajuKurung = new THREE.Mesh(
    new THREE.BoxGeometry(0.70, 0.68, 0.44),
    new THREE.MeshLambertMaterial({ color: 0x059669 })
  );
  bajuKurung.position.y = 1.30;
  teacherGroup.add(bajuKurung);

  // Renda / Jalur Emas Hujung Baju
  const bajuTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.035, 0.46),
    new THREE.MeshLambertMaterial({ color: 0xF59E0B })
  );
  bajuTrim.position.y = 0.98;
  teacherGroup.add(bajuTrim);

  // Tanda Nama Rasmi Guru (Name Badge "CIKGU ASYIKIN")
  const badgePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.05, 0.02),
    new THREE.MeshLambertMaterial({ color: 0x0F172A })
  );
  badgePlate.position.set(-0.18, 1.44, 0.23);
  teacherGroup.add(badgePlate);

  const badgeTextLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.015, 0.025),
    new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  );
  badgeTextLine.position.set(-0.18, 1.44, 0.23);
  teacherGroup.add(badgeTextLine);

  // D. Labuh Tudung Bahu & Dada (Hijab Drape / Shawl over Shoulders)
  const tudungMat = new THREE.MeshLambertMaterial({ color: 0xFFFBEB }); // Soft Vanilla Cream
  const tudungTrimMat = new THREE.MeshLambertMaterial({ color: 0xFDE68A }); // Warm Gold Accent

  const tudungCowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.58, 0.44, 16),
    tudungMat
  );
  tudungCowl.position.y = 1.58;
  teacherGroup.add(tudungCowl);

  // Lipatan V-Shape di Dada
  const frontDrape = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.34, 0.06),
    tudungTrimMat
  );
  frontDrape.position.set(0, 1.50, 0.23);
  frontDrape.rotation.x = -0.1;
  teacherGroup.add(frontDrape);

  // Kerongsang Emas (Gold Brooch Pin)
  const brooch = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.04, 0),
    new THREE.MeshLambertMaterial({ color: 0xF59E0B })
  );
  brooch.position.set(0, 1.64, 0.26);
  teacherGroup.add(brooch);

  // E. Lengan Kanan Memegang Pen Merah Cikgu
  const armR = new THREE.Group();
  armR.position.set(0.40, 1.55, 0.05);

  const sleeveR = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.48, 0.16),
    new THREE.MeshLambertMaterial({ color: 0x059669 })
  );
  sleeveR.position.set(0, -0.20, 0.08);
  sleeveR.rotation.x = -0.32;
  armR.add(sleeveR);

  const handR = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.12, 0.10),
    new THREE.MeshLambertMaterial({ color: 0xF7CE9E })
  );
  handR.position.set(0, -0.42, 0.18);
  armR.add(handR);

  // Pen Merah Memeriksa Latihan
  const penMerah = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6),
    new THREE.MeshLambertMaterial({ color: 0xDC2626 })
  );
  penMerah.position.set(0.03, -0.38, 0.24);
  penMerah.rotation.x = -0.4;
  armR.add(penMerah);

  teacherGroup.add(armR);

  // F. Lengan Kiri Melambai Mesra (Waving Arm)
  const armL = new THREE.Group();
  armL.position.set(-0.42, 1.56, 0);

  const sleeveL = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.46, 0.16),
    new THREE.MeshLambertMaterial({ color: 0x059669 })
  );
  sleeveL.position.y = -0.20;
  armL.add(sleeveL);

  const cuffL = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.03, 0.17),
    new THREE.MeshLambertMaterial({ color: 0xF59E0B })
  );
  cuffL.position.y = -0.42;
  armL.add(cuffL);

  const handL = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.12, 0.06),
    new THREE.MeshLambertMaterial({ color: 0xF7CE9E })
  );
  handL.position.y = -0.48;
  armL.add(handL);

  teacherGroup.add(armL);

  // G. Kepala dengan Tudung Bawal & Spek (Teacher Head Group)
  const teacherHead = new THREE.Group();
  teacherHead.position.set(0, 1.95, 0);

  // 1. Muka Kulit Berseri (Face Block - Warm Caramel/Peach Skin)
  const faceMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.32, 0.24),
    new THREE.MeshLambertMaterial({ color: 0xF7CE9E }) // Warm Natural Skin
  );
  faceMesh.position.set(0, 0.02, 0.12);
  teacherHead.add(faceMesh);

  // 2. Tudung Belakang & Kepala Atas (Hijab Back & Crown - Positif Z belakang)
  const tudungBack = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 18, 16),
    tudungMat
  );
  tudungBack.position.set(0, 0.04, -0.12);
  teacherHead.add(tudungBack);

  // Kubah Atas Tudung (Top of Hijab)
  const tudungTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.10, 0.32),
    tudungMat
  );
  tudungTop.position.set(0, 0.19, 0.02);
  teacherHead.add(tudungTop);

  // 3. Awning Tudung Bawal Kemas di Dahi (Hijab Awning / Peak above eyebrows)
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.05, 0.12),
    tudungTrimMat
  );
  awning.position.set(0, 0.18, 0.24);
  awning.rotation.x = 0.22;
  teacherHead.add(awning);

  // Lipatan Tudung di Sisi Pipi Kiri & Kanan (Hijab Side Cheek Wraps)
  const cheekL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.22), tudungMat);
  cheekL.position.set(-0.19, 0.02, 0.13);
  teacherHead.add(cheekL);

  const cheekR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.22), tudungMat);
  cheekR.position.set(0.19, 0.02, 0.13);
  teacherHead.add(cheekR);

  // Pelapik Dagu Tudung (Under-Chin Hijab Wrap below smile)
  const tudungChin = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.08, 0.20),
    tudungMat
  );
  tudungChin.position.set(0, -0.15, 0.14);
  teacherHead.add(tudungChin);

  // 4. Mata Murid Cikgu (Cute Expressive Teacher Eyes with Sparkles)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });
  const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

  // Mata Kiri
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, 0.02), eyeMat);
  eyeL.position.set(-0.09, 0.04, 0.245);
  teacherHead.add(eyeL);

  const spL = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.025), sparkleMat);
  spL.position.set(-0.08, 0.055, 0.25);
  teacherHead.add(spL);

  // Mata Kanan
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, 0.02), eyeMat);
  eyeR.position.set(0.09, 0.04, 0.245);
  teacherHead.add(eyeR);

  const spR = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.025), sparkleMat);
  spR.position.set(0.10, 0.055, 0.25);
  teacherHead.add(spR);

  // Kening Lembut (Gentle Eyebrows)
  const browMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 0.02), browMat);
  browL.position.set(-0.09, 0.11, 0.245);
  browL.rotation.z = 0.08;
  teacherHead.add(browL);

  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 0.02), browMat);
  browR.position.set(0.09, 0.11, 0.245);
  browR.rotation.z = -0.08;
  teacherHead.add(browR);

  // Pipi Merah Jambu Comel (Rosy Blush)
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xFB7185, side: THREE.DoubleSide });
  const blushL = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.03), blushMat);
  blushL.position.set(-0.13, -0.03, 0.245);
  teacherHead.add(blushL);

  const blushR = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.03), blushMat);
  blushR.position.set(0.13, -0.03, 0.245);
  teacherHead.add(blushR);

  // Senyuman Mesra Cikgu Asyikin (Warm Teacher Smile)
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.012, 6, 12, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xE11D48 })
  );
  smile.position.set(0, -0.065, 0.245);
  smile.rotation.z = Math.PI; // Inverted so it curves upward into a happy smile
  teacherHead.add(smile);

  // 5. CERMIN MATA / SPEK GURU (Smart Teacher Spectacles)
  const glassFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B, // Smart Midnight Dark Rim
    metalness: 0.6,
    roughness: 0.3
  });

  const lensMat = new THREE.MeshBasicMaterial({
    color: 0xBAE6FD,
    transparent: true,
    opacity: 0.40,
    side: THREE.DoubleSide
  });

  // Bingkai Kiri (Left Rim)
  const rimL = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 8, 20), glassFrameMat);
  rimL.position.set(-0.09, 0.04, 0.265);
  teacherHead.add(rimL);

  const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.058, 16), lensMat);
  lensL.position.set(-0.09, 0.04, 0.26);
  teacherHead.add(lensL);

  // Bingkai Kanan (Right Rim)
  const rimR = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 8, 20), glassFrameMat);
  rimR.position.set(0.09, 0.04, 0.265);
  teacherHead.add(rimR);

  const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.058, 16), lensMat);
  lensR.position.set(0.09, 0.04, 0.26);
  teacherHead.add(lensR);

  // Jambatan Spek di Atas Batang Hidung (Nose Bridge)
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.015), glassFrameMat);
  bridge.position.set(0, 0.04, 0.265);
  teacherHead.add(bridge);

  // Tangkai Spek Masuk ke Sisi Tudung (Temples)
  const templeL = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.16), glassFrameMat);
  templeL.position.set(-0.16, 0.04, 0.18);
  teacherHead.add(templeL);

  const templeR = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.16), glassFrameMat);
  templeR.position.set(0.16, 0.04, 0.18);
  teacherHead.add(templeR);

  teacherGroup.add(teacherHead);

  // H. Tag Nama Terapung "Cikgu Asyikin (Guru BM)"
  const teacherTag = createTextSprite('Cikgu Asyikin (Guru BM)', 'rgba(6, 78, 59, 0.94)', '#A7F3D0', 576, 160, 48);
  teacherTag.scale.set(3.4, 1.4, 1);
  teacherTag.position.set(0, 2.75, 0);
  teacherGroup.add(teacherTag);

  roomGroup.add(teacherGroup);
  // 6. Windows: 4 window frames on North and West walls
  function buildWindow(width, height) {
    const winGroup = new THREE.Group();
    // Wooden Outer Frame
    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.2, height + 0.2, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x78350F })
    );
    winGroup.add(frameMesh);

    // Light Blue Glass Pane
    const glassMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color: 0xBAE6FD, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    glassMesh.position.z = 0.02;
    winGroup.add(glassMesh);

    // Wooden Louvers / Crossbars (Horizontal & Vertical)
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

    // Bottom Window Sill
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.35, 0.1, 0.25),
      new THREE.MeshLambertMaterial({ color: 0x592911 })
    );
    sill.position.set(0, -height / 2 - 0.05, 0.08);
    winGroup.add(sill);

    return winGroup;
  }

  // 2 Windows on North Wall (flanking the main banner)
  const winNorthLeft = buildWindow(2.2, 2.0);
  winNorthLeft.position.set(-10.5, 3.4, -10.7);
  roomGroup.add(winNorthLeft);

  const winNorthRight = buildWindow(2.2, 2.0);
  winNorthRight.position.set(10.5, 3.4, -10.7);
  roomGroup.add(winNorthRight);

  // 2 Windows on West Wall
  const winWestNorth = buildWindow(2.2, 2.0);
  winWestNorth.rotation.y = Math.PI / 2;
  winWestNorth.position.set(-12.7, 3.4, -4.5);
  roomGroup.add(winWestNorth);

  const winWestSouth = buildWindow(2.2, 2.0);
  winWestSouth.rotation.y = Math.PI / 2;
  winWestSouth.position.set(-12.7, 3.4, 4.5);
  roomGroup.add(winWestSouth);

  // 7. Indoor Potted Plants Helper & Placements
  function createPottedPlant(px, pz) {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(px, 0, pz);

    // White Ceramic Pot
    const potMat = new THREE.MeshLambertMaterial({ color: 0xF8FAFC });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.75, 12), potMat);
    pot.position.y = 0.375;
    pot.castShadow = true;
    plantGroup.add(pot);

    // Top Soil
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.06, 12), new THREE.MeshLambertMaterial({ color: 0x451A03 }));
    soil.position.y = 0.74;
    plantGroup.add(soil);

    // Lush Overlapping Green Spheres (Foliage)
    const foliageMat1 = new THREE.MeshLambertMaterial({ color: 0x15803D });
    const foliageMat2 = new THREE.MeshLambertMaterial({ color: 0x16A34A });
    const foliageMat3 = new THREE.MeshLambertMaterial({ color: 0x22C55E });

    const centerBush = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), foliageMat1);
    centerBush.position.y = 1.05;
    plantGroup.add(centerBush);

    const bushClusters = [
      { x: 0.24, y: 1.15, z: 0.12, r: 0.32, mat: foliageMat2 },
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

  // Place 4 indoor plants (corners and near flagpole)
  createPottedPlant(-10.2, -7.5); // Near flagpole
  createPottedPlant(11.2, -9.5);  // North-East corner
  createPottedPlant(-11.2, 8.5);  // South-West corner
  createPottedPlant(11.2, 8.5);   // South-East corner

  // 8. Teacher's Rostrum with Tiny Mic (Placed directly in front of Cikgu Asyikin)
  const rostrumGroup = new THREE.Group();
  rostrumGroup.position.set(2.0, 0, -2.1);

  // Stacked brown wooden boxes
  const rostrumBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.14, 0.85),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  rostrumBase.position.y = 0.07;
  rostrumGroup.add(rostrumBase);

  const rostrumPillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.05, 0.6),
    new THREE.MeshLambertMaterial({ color: 0x92400E })
  );
  rostrumPillar.position.y = 0.65;
  rostrumGroup.add(rostrumPillar);

  // Slanted top reading desk
  const rostrumTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.08, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  rostrumTop.position.set(0, 1.22, 0);
  rostrumTop.rotation.x = 0.12;
  rostrumGroup.add(rostrumTop);

  // Tiny Black Microphone
  const micStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.28, 8),
    new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.8 })
  );
  micStem.position.set(0.18, 1.4, -0.08);
  micStem.rotation.x = -0.2;
  rostrumGroup.add(micStem);

  const micHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.5 })
  );
  micHead.position.set(0.18, 1.54, -0.12);
  rostrumGroup.add(micHead);

  // Buku Teks Bahasa Melayu di Atas Rostrum
  const textBook = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.035, 0.28),
    new THREE.MeshLambertMaterial({ color: 0x1E40AF })
  );
  textBook.position.set(-0.16, 1.28, 0.02);
  textBook.rotation.x = 0.12;
  rostrumGroup.add(textBook);

  const bookStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.39, 0.038, 0.05),
    new THREE.MeshLambertMaterial({ color: 0xF59E0B })
  );
  bookStripe.position.set(-0.16, 1.28, 0.02);
  bookStripe.rotation.x = 0.12;
  rostrumGroup.add(bookStripe);

  roomGroup.add(rostrumGroup);
  roomColliders.push({ minX: 1.3, maxX: 2.7, minZ: -2.6, maxZ: -1.5 });

  // 9. Wooden Benches on Left & Right Sides of Red Carpet
  function createWoodenBench(bx, bz, rotY) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(bx, 0, bz);
    benchGroup.rotation.y = rotY;

    const benchWoodMat = new THREE.MeshLambertMaterial({ color: 0x78350F });
    const legWoodMat = new THREE.MeshLambertMaterial({ color: 0x451A03 });

    // Seat plank
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 0.8), benchWoodMat);
    seat.position.y = 0.48;
    benchGroup.add(seat);

    // Backrest plank
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 0.08), benchWoodMat);
    backrest.position.set(0, 0.88, -0.36);
    benchGroup.add(backrest);

    // 4 Wooden legs
    const legPositions = [
      [-1.3, 0.24, -0.3],
      [1.3, 0.24, -0.3],
      [-1.3, 0.24, 0.3],
      [1.3, 0.24, 0.3]
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), legWoodMat);
      leg.position.set(lx, ly, lz);
      benchGroup.add(leg);
    });

    roomGroup.add(benchGroup);
  }

  createWoodenBench(-4.5, 1.5, Math.PI / 2);  // Left bench facing red carpet
  createWoodenBench(4.5, 1.5, -Math.PI / 2); // Right bench facing red carpet
  roomColliders.push({ minX: -5.1, maxX: -3.9, minZ: 0.0, maxZ: 3.0 });
  roomColliders.push({ minX: 3.9, maxX: 5.1, minZ: 0.0, maxZ: 3.0 });

  // 10. Pendant Lamps: 4 warm-colored glowing spheres hanging from ceiling
  const lampPositions = [
    [-5.0, -3.5],
    [5.0, -3.5],
    [-5.0, 4.0],
    [5.0, 4.0]
  ];

  lampPositions.forEach(([lx, lz]) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(lx, 0, lz);

    // Suspension cord from ceiling (y=5.5 down to y=4.2)
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8),
      new THREE.MeshLambertMaterial({ color: 0x334155 })
    );
    cord.position.y = 4.85;
    lampGroup.add(cord);

    // Glowing Sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xFFDDAA })
    );
    sphere.position.y = 4.2;
    lampGroup.add(sphere);

    // Warm Ambient Point Light
    const pLight = new THREE.PointLight(0xFFDDAA, 0.75, 8.0);
    pLight.position.y = 4.2;
    lampGroup.add(pLight);

    roomGroup.add(lampGroup);
  });

  return {
    teacherWavingArm: armL,
    teacherHead
  };
}
