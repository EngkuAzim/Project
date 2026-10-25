// ==========================================
// ROOMS/ROOM4.JS - Studio Persembahan Seni Khat (Art Studio at 400, 400)
// ==========================================
import { createTextCanvasTexture, createTextSprite, buildCutawayRoomShell, resolveRoomArgs } from './helpers.js';

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

export function buildRoom4(arg1, arg2, arg3) {
  const { targetGroup: roomGroup, collidersList: roomColliders } = resolveRoomArgs(arg1, arg2, arg3);
  const cx = 400, cz = 400;
  // Warm wooden art studio floor with amber grid tiles (GridHelper at y = 0.01)
  buildCutawayRoomShell(roomGroup, roomColliders, cx, cz, 0xD2B48C, 0xF8FAFC, 0xF1F5F9, 0x78350F, 26, 22, 0x9A3412, 0xB45309);

  // 1. Studio Main Banner on North Wall
  const artTex = createTextCanvasTexture(
    'STUDIO PERSEMBAHAN SENI KHAT JAWI',
    '#9A3412',
    '#FEF3C7',
    1024,
    256,
    48,
    'Galeri Karya Kreatif • Mempersembahkan Keindahan Seni Tulisan Jawi'
  );
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(14.0, 3.2), new THREE.MeshBasicMaterial({ map: artTex }));
  bannerMesh.position.set(cx, 3.4, cz - 10.7);
  roomGroup.add(bannerMesh);

  // 2. Decorative Traditional Fabric Panels (Songket & Batik) behind Main Canvas Area
  function createFabricPanel(px, pz, title, bg, accent) {
    const panelGroup = new THREE.Group();
    panelGroup.position.set(px, 3.0, pz);

    // Main hanging textile banner
    const fabricTex = createTextCanvasTexture(title, bg, accent, 512, 1024, 38, '✦ Motif Songket & Seni Khat Warisan ✦');
    const fabricMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 5.0),
      new THREE.MeshBasicMaterial({ map: fabricTex, side: THREE.DoubleSide })
    );
    panelGroup.add(fabricMesh);

    // Top Carved Wooden Suspension Bar
    const topRod = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.08, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x78350F })
    );
    topRod.position.set(0, 2.54, 0.04);
    panelGroup.add(topRod);

    // Gold Finials on Top Bar
    [-1.75, 1.75].forEach((fx) => {
      const finial = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.2 })
      );
      finial.position.set(fx, 2.54, 0.04);
      panelGroup.add(finial);
    });

    // Bottom Weighted Brass Bar
    const bottomRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 3.3, 8),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.8, roughness: 0.25 })
    );
    bottomRod.rotation.z = Math.PI / 2;
    bottomRod.position.set(0, -2.52, 0.04);
    panelGroup.add(bottomRod);

    roomGroup.add(panelGroup);
  }

  // Left & Right Traditional Fabric Panels flanking the central easel on North Wall
  createFabricPanel(cx - 4.5, cz - 10.66, 'SONGKET EMAS WARISAN', '#0F2756', '#FBBF24');
  createFabricPanel(cx + 4.5, cz - 10.66, 'BATIK SUTERA CEMERLANG', '#881337', '#FEF08A');

  // 3. Framed Wall Art: 4 Wall Frames with Glowing Gallery Spotlights
  function createFramedWallArt(fx, fy, fz, rotY, title, subtitle, bg, fg) {
    const frameGroup = new THREE.Group();
    frameGroup.position.set(fx, fy, fz);
    frameGroup.rotation.y = rotY;

    // Dark Brown Outer Wood Frame
    const outerFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.75, 2.35),
      new THREE.MeshLambertMaterial({ color: 0x78350F })
    );
    frameGroup.add(outerFrame);

    // Inner Gold Bezel Rim
    const innerRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 1.62, 2.22),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.2 })
    );
    frameGroup.add(innerRim);

    // Calligraphic Artwork Canvas
    const artTex = createTextCanvasTexture(title, bg, fg, 512, 384, 40, subtitle);
    const canvas = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 1.5),
      new THREE.MeshBasicMaterial({ map: artTex, side: THREE.DoubleSide })
    );
    canvas.rotation.y = Math.PI / 2;
    canvas.position.x = 0.06;
    frameGroup.add(canvas);

    // Gallery Spotlight Fixture (Brass Arm & Light)
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.2 })
    );
    arm.rotation.z = Math.PI / 3;
    arm.position.set(0.18, 1.05, 0);
    frameGroup.add(arm);

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0x78350F })
    );
    shade.rotation.z = -Math.PI / 3;
    shade.position.set(0.3, 0.95, 0);
    frameGroup.add(shade);

    // Glowing Spotlight Source
    const spotLight = new THREE.PointLight(0xFFFBEB, 0.95, 4.2);
    spotLight.position.set(0.32, 0.88, 0);
    frameGroup.add(spotLight);

    roomGroup.add(frameGroup);
  }

  // 4 Framed Wall Artworks on West & East Walls
  createFramedWallArt(cx - 12.65, 3.2, cz - 4.5, 0, 'KHAT NASAKH', 'اولت بوکو • Ulat Buku', '#064E3B', '#FDE68A');
  createFramedWallArt(cx - 12.65, 3.2, cz + 5.5, 0, 'KHAT THULUTH', 'انق امس • Anak Emas', '#1E3A8A', '#FEF08A');
  createFramedWallArt(cx + 12.65, 3.2, cz - 4.5, Math.PI, 'KHAT RIQ\'AH', 'بواه هاتي • Buah Hati', '#881337', '#FEF08A');
  createFramedWallArt(cx + 12.65, 3.2, cz + 5.5, Math.PI, 'KHAT DIWANI', 'چهاي مات • Cahaya Mata', '#78350F', '#FEF3C7');

  // 4. Craftsman Workbench: Long Wooden Table with Ink Bottles & Bamboo Pens (Kalam)
  const workbenchGroup = new THREE.Group();
  workbenchGroup.position.set(cx - 7.5, 0, cz - 1.5);

  // Heavy Teak Workbench Top
  const benchTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.14, 1.4),
    new THREE.MeshLambertMaterial({ color: 0x78350F })
  );
  benchTop.position.y = 0.85;
  benchTop.castShadow = true;
  workbenchGroup.add(benchTop);

  // 4 Sturdy Wooden Table Legs
  [[-1.6, -0.55], [1.6, -0.55], [-1.6, 0.55], [1.6, 0.55]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), new THREE.MeshLambertMaterial({ color: 0x592911 }));
    leg.position.set(lx, 0.4, lz);
    workbenchGroup.add(leg);
  });

  // Stretcher Shelf underneath workbench
  const underShelf = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.04, 1.1), new THREE.MeshLambertMaterial({ color: 0x92400E }));
  underShelf.position.y = 0.32;
  workbenchGroup.add(underShelf);

  // A. Ink Bottles (Small Black & Gold Cylinders)
  // Black Ink Pot (Dakwat Hitam Pekat)
  const inkPotBlack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.3 })
  );
  inkPotBlack.position.set(-0.8, 0.99, -0.2);
  workbenchGroup.add(inkPotBlack);

  const inkCapBlack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10),
    new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.2 })
  );
  inkCapBlack.position.set(-0.8, 1.1, -0.2);
  workbenchGroup.add(inkCapBlack);

  // Gold Calligraphy Ink Pot (Dakwat Emas)
  const inkPotGold = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.25 })
  );
  inkPotGold.position.set(-0.5, 0.98, -0.2);
  workbenchGroup.add(inkPotGold);

  // B. Bamboo Pens / Kalam (Thin Brown Cylinders on Pen Rest)
  const penRest = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.04, 0.38),
    new THREE.MeshLambertMaterial({ color: 0x592911 })
  );
  penRest.position.set(0.1, 0.94, -0.1);
  workbenchGroup.add(penRest);

  [-0.08, 0, 0.08].forEach((pz, idx) => {
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.48, 8),
      new THREE.MeshLambertMaterial({ color: 0xB45309 })
    );
    pen.rotation.x = Math.PI / 2;
    pen.position.set(0.1, 0.98, -0.1 + pz);
    workbenchGroup.add(pen);

    // Pen tip (slant-cut reed/bamboo)
    const penTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.016, 0.08, 6),
      new THREE.MeshStandardMaterial({ color: 0x0F172A })
    );
    penTip.rotation.x = -Math.PI / 2;
    penTip.position.set(0.1, 0.98, -0.1 + pz + 0.26);
    workbenchGroup.add(penTip);
  });

  // C. Rolled Rice Paper Scroll lying on workbench
  const rolledPaper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.85, 12),
    new THREE.MeshStandardMaterial({ color: 0xFFFDF0, roughness: 0.5 })
  );
  rolledPaper.rotation.z = Math.PI / 2;
  rolledPaper.position.set(0.9, 0.97, 0.15);
  workbenchGroup.add(rolledPaper);

  // Slate Stone Ink Mixing Dish
  const inkStone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.04, 14),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
  );
  inkStone.position.set(-0.65, 0.94, 0.2);
  workbenchGroup.add(inkStone);

  roomGroup.add(workbenchGroup);
  roomColliders.push({ minX: cx - 9.5, maxX: cx - 5.5, minZ: cz - 2.4, maxZ: cz - 0.6 });

  // 5. Scroll Bins: 2 Tall Cylinders in Corners filled with Rolled Paper Scrolls
  function createScrollBin(bx, bz) {
    const binGroup = new THREE.Group();
    binGroup.position.set(bx, 0, bz);

    // Tall Ceramic Glazed Cylinder Bin
    const binBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.38, 1.05, 16),
      new THREE.MeshLambertMaterial({ color: 0x92400E })
    );
    binBody.position.y = 0.525;
    binBody.castShadow = true;
    binGroup.add(binBody);

    // Decorative Gold Rim on Bin
    const binRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.2 })
    );
    binRim.position.y = 1.05;
    binGroup.add(binRim);

    // Inner Dark Opening
    const innerVoid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16),
      new THREE.MeshLambertMaterial({ color: 0x1E293B })
    );
    innerVoid.position.y = 1.02;
    binGroup.add(innerVoid);

    // 5 Rolled Parchment Scrolls protruding upwards at slight random angles
    const scrollAngles = [
      { x: 0.1, z: 0.12, rotX: 0.14, rotZ: 0.08, len: 1.05, color: 0xFFFDF0 },
      { x: -0.12, z: 0.08, rotX: -0.12, rotZ: -0.15, len: 0.95, color: 0xFEF3C7 },
      { x: 0.05, z: -0.15, rotX: 0.15, rotZ: -0.10, len: 1.15, color: 0xFFFBEB },
      { x: -0.15, z: -0.1, rotX: -0.10, rotZ: 0.12, len: 0.9, color: 0xFEE2E2 },
      { x: 0.14, z: -0.05, rotX: 0.08, rotZ: 0.16, len: 1.0, color: 0xE0F2FE }
    ];

    scrollAngles.forEach((s) => {
      const scroll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, s.len, 10),
        new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.5 })
      );
      scroll.position.set(s.x, 0.55 + s.len / 2, s.z);
      scroll.rotation.x = s.rotX;
      scroll.rotation.z = s.rotZ;
      binGroup.add(scroll);
    });

    roomGroup.add(binGroup);
    roomColliders.push({ minX: bx - 0.55, maxX: bx + 0.55, minZ: bz - 0.55, maxZ: bz + 0.55 });
  }

  // 2 Scroll Bins placed in NE Corner and SE Corner
  createScrollBin(cx + 11.2, cz - 9.2); // NE Corner
  createScrollBin(cx + 11.2, cz + 8.5); // SE Corner

  // 6. Perimeter Wall Furniture: Art Supply Cabinet along West Wall
  const supplyCabinet = new THREE.Group();
  supplyCabinet.position.set(cx - 12.0, 0, cz + 2.0);
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.6, 3.2), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  cabBody.position.y = 1.3;
  supplyCabinet.add(cabBody);
  roomGroup.add(supplyCabinet);
  roomColliders.push({ minX: cx - 12.6, maxX: cx - 11.2, minZ: cz + 0.2, maxZ: cz + 3.8 });

  // 7. Perimeter Wall Furniture: Student Exhibition Shelving along North Wall Edge
  const exhibitionShelf = new THREE.Group();
  exhibitionShelf.position.set(cx + 8.0, 0, cz - 10.2);
  const exBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.0, 0.8), new THREE.MeshLambertMaterial({ color: 0x92400E }));
  exBody.position.y = 1.5;
  exhibitionShelf.add(exBody);

  // Sample student artwork mounted on shelf
  const sampleTex1 = createTextCanvasTexture('KHAT: ULAT BUKU', '#1E293B', '#FDE68A', 512, 256, 36);
  const artPanel1 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: sampleTex1 }));
  artPanel1.position.set(-0.8, 2.0, 0.42);
  exhibitionShelf.add(artPanel1);

  const sampleTex2 = createTextCanvasTexture('KHAT: ANAK EMAS', '#065F46', '#FEF3C7', 512, 256, 36);
  const artPanel2 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: sampleTex2 }));
  artPanel2.position.set(0.8, 2.0, 0.42);
  exhibitionShelf.add(artPanel2);

  roomGroup.add(exhibitionShelf);
  roomColliders.push({ minX: cx + 6.0, maxX: cx + 10.0, minZ: cz - 10.8, maxZ: cz - 9.5 });

  // 8. Perimeter Wall Furniture: Calligraphy Tool Storage along East Wall
  const eastRack = new THREE.Group();
  eastRack.position.set(cx + 12.0, 0, cz + 2.0);
  const rackBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 2.8), new THREE.MeshLambertMaterial({ color: 0xB45309 }));
  rackBody.position.y = 1.0;
  eastRack.add(rackBody);
  roomGroup.add(eastRack);
  roomColliders.push({ minX: cx + 11.2, maxX: cx + 12.6, minZ: cz + 0.5, maxZ: cz + 3.5 });

  // 9. Central Masterpiece Assembly Station (r4AssemblyStation) at (400.0, 395.5)
  const stationGroup = new THREE.Group();
  stationGroup.position.set(400.0, 0, 395.5);

  // Large Standing Masterpiece Easel
  const easelMat = new THREE.MeshLambertMaterial({ color: 0x92400E });
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

  roomGroup.add(stationGroup);
  roomColliders.push({ minX: 398.2, maxX: 401.8, minZ: 394.2, maxZ: 396.8 });

  return {
    r4AssemblyStation: { group: stationGroup, beacon },
    updateMasterpieceEaselTexture,
    spawnR4ArtTools
  };
}

/**
 * Spawns 3D Art Studio Supplies for Room 4
 */
export function spawnR4ArtTools(items, targetGroup) {
  items.forEach((item) => {
    const itemGroup = new THREE.Group();
    itemGroup.position.set(item.pos.x, item.pos.y, item.pos.z);

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

      // Gold filigree corner accents
      const cornerMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.8 });
      [[-0.4, -0.55], [0.4, -0.55], [-0.4, 0.55], [0.4, 0.55]].forEach(([cxPos, cyPos]) => {
        const cPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.09), cornerMat);
        cPlate.position.set(cxPos, cyPos, 0);
        supplyGroup.add(cPlate);
      });
    }

    // Floating sprite label above tool
    const toolTag = createTextSprite(
      `${item.char} ${item.label}`,
      'rgba(15, 23, 42, 0.94)',
      '#FEF08A',
      512,
      180,
      54
    );
    toolTag.scale.set(3.4, 1.6, 1);
    toolTag.position.set(0, 1.6, 0);
    itemGroup.add(toolTag);

    supplyGroup.castShadow = true;
    itemGroup.add(supplyGroup);

    // Glowing point light
    const light = new THREE.PointLight(item.color, 1.5, 5);
    itemGroup.add(light);

    item.mesh = itemGroup;
    item.gemMesh = supplyGroup;
    item.ringMesh = null;
    item.pointLight = light;
    item.isPopping = false;
    item.popScale = 1.0;

    targetGroup.add(itemGroup);
  });
}
