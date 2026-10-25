// ==========================================
// ROOMS/ROOM3.JS - Arkib Simpulan Bahasa (Library at 300, 300)
// ==========================================
import { createTextCanvasTexture, createTextSprite, buildCutawayRoomShell, resolveRoomArgs } from './helpers.js';

export function buildRoom3(arg1, arg2, arg3) {
  const { targetGroup: roomGroup, collidersList: roomColliders } = resolveRoomArgs(arg1, arg2, arg3);
  const cx = 300, cz = 300;
  // Warm wooden floor with amber grid tiles (GridHelper at y = 0.01)
  buildCutawayRoomShell(roomGroup, roomColliders, cx, cz, 0xC19A6B, 0x78350F, 0x92400E, 0xD97706, 26, 22, 0x92400E, 0xB45309);

  // 1. Library Main Banner on North Wall
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
  roomGroup.add(bannerMesh);

  // 2. Reading Rug: Large flat circular CylinderGeometry (maroon / dark red) under main reading table
  const rugBorder = new THREE.Mesh(
    new THREE.CylinderGeometry(4.4, 4.4, 0.02, 32),
    new THREE.MeshLambertMaterial({ color: 0xD97706 })
  );
  rugBorder.position.set(cx, 0.015, 296.0);
  roomGroup.add(rugBorder);

  const rugMain = new THREE.Mesh(
    new THREE.CylinderGeometry(4.1, 4.1, 0.025, 32),
    new THREE.MeshLambertMaterial({ color: 0x881337 }) // Maroon / Dark Red
  );
  rugMain.position.set(cx, 0.02, 296.0);
  roomGroup.add(rugMain);

  const rugInner = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.2, 0.03, 32),
    new THREE.MeshLambertMaterial({ color: 0x9F1239 })
  );
  rugInner.position.set(cx, 0.025, 296.0);
  roomGroup.add(rugInner);

  // 3. Tall Teak Bookshelves along North Wall Edge
  const shelfMat = new THREE.MeshLambertMaterial({ color: 0x592911 });
  [-8.0, -4.0, 4.0, 8.0].forEach((ox) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.2, 0.9), shelfMat);
    shelf.position.set(cx + ox, 2.3, cz - 10.2);
    shelf.castShadow = true;
    roomGroup.add(shelf);

    // Rows of books inside shelf
    const bookColors = [0xDC2626, 0x2563EB, 0x16A34A, 0xD97706, 0x7C3AED];
    for (let r = 0; r < 3; r++) {
      const bookBlock = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.8, 0.7),
        new THREE.MeshLambertMaterial({ color: bookColors[(r + Math.abs(ox)) % bookColors.length] })
      );
      bookBlock.position.set(cx + ox, 1.2 + r * 1.1, cz - 10.2);
      roomGroup.add(bookBlock);
    }
    roomColliders.push({ minX: cx + ox - 1.7, maxX: cx + ox + 1.7, minZ: cz - 10.8, maxZ: cz - 9.6 });
  });

  // 4. Perimeter Wall Furniture: Study Carrel / Reading Desk along West Wall
  const studyDesk = new THREE.Group();
  studyDesk.position.set(cx - 11.8, 0, cz + 2.5);
  const sdTop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 3.2), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  sdTop.position.y = 0.9;
  studyDesk.add(sdTop);

  const sdLegs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.84, 3.0), new THREE.MeshLambertMaterial({ color: 0x92400E }));
  sdLegs.position.y = 0.42;
  studyDesk.add(sdLegs);

  const carrelDivider = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.08), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
  carrelDivider.position.set(0, 1.25, 0);
  studyDesk.add(carrelDivider);

  roomGroup.add(studyDesk);
  roomColliders.push({ minX: cx - 12.6, maxX: cx - 11.0, minZ: cz + 0.8, maxZ: cz + 4.2 });

  // 5. Perimeter Wall Furniture: Librarian Circulation Counter along East Wall
  const counterGroup = new THREE.Group();
  counterGroup.position.set(cx + 10.5, 0, cz + 3.5);

  const cDesk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 4.0), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  cDesk.position.y = 0.55;
  counterGroup.add(cDesk);

  const cTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 4.2), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
  cTop.position.y = 1.12;
  counterGroup.add(cTop);

  // Computer monitor on counter
  const mon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.6), new THREE.MeshStandardMaterial({ color: 0x1E293B }));
  mon.position.set(0, 1.42, -0.8);
  counterGroup.add(mon);

  roomGroup.add(counterGroup);
  roomColliders.push({ minX: cx + 9.5, maxX: cx + 11.8, minZ: cz + 1.2, maxZ: cz + 5.8 });

  // 6. Classic Banker's Desk Lamps Helper
  function createBankersLamp(lx, ly, lz, rotY = 0) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(lx, ly, lz);
    lampGroup.rotation.y = rotY;

    // Small Gold Cylinder Base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.04, 14),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.2 })
    );
    base.position.y = 0.02;
    lampGroup.add(base);

    // Gold Brass Stem
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.85, roughness: 0.2 })
    );
    stem.position.y = 0.2;
    lampGroup.add(stem);

    // Green Semi-Cylinder / Banker's Hood Shade
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.16, 0.32, 16, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x065F46, roughness: 0.25 })
    );
    shade.rotation.z = Math.PI / 2;
    shade.rotation.x = Math.PI / 2;
    shade.position.y = 0.38;
    lampGroup.add(shade);

    // Warm Light Bulb & PointLight
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xFEF08A }));
    bulb.position.y = 0.34;
    lampGroup.add(bulb);

    const warmLight = new THREE.PointLight(0xFEF08A, 0.85, 3.5);
    warmLight.position.y = 0.34;
    lampGroup.add(warmLight);

    roomGroup.add(lampGroup);
  }

  // Banker's Lamps placed on Main Reading Table, Counter, and Study Carrel
  createBankersLamp(cx - 1.5, 1.09, 296.0, 0);
  createBankersLamp(cx + 1.5, 1.09, 296.0, 0);
  createBankersLamp(cx + 10.5, 1.17, cz + 4.5, -Math.PI / 2);
  createBankersLamp(cx - 11.8, 0.96, cz + 2.5, Math.PI / 2);

  // 7. Cozy Beanbag Chairs (Squashed Spheres: Orange & Mint Green) in SW Corner
  const beanbagGroup = new THREE.Group();
  beanbagGroup.position.set(cx - 9.5, 0, cz + 8.0);

  // Orange Beanbag
  const orangeBeanMat = new THREE.MeshLambertMaterial({ color: 0xF97316 });
  const orangeBean = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), orangeBeanMat);
  orangeBean.scale.set(1.15, 0.65, 1.15);
  orangeBean.position.set(-0.3, 0.44, -0.2);
  orangeBean.castShadow = true;
  beanbagGroup.add(orangeBean);

  // Mint Green Beanbag
  const mintBeanMat = new THREE.MeshLambertMaterial({ color: 0x34D399 });
  const mintBean = new THREE.Mesh(new THREE.SphereGeometry(0.78, 16, 12), mintBeanMat);
  mintBean.scale.set(1.1, 0.62, 1.1);
  mintBean.position.set(1.1, 0.40, 0.8);
  mintBean.castShadow = true;
  beanbagGroup.add(mintBean);

  roomGroup.add(beanbagGroup);
  roomColliders.push({ minX: cx - 11.0, maxX: cx - 7.5, minZ: cz + 6.8, maxZ: cz + 9.8 });

  // 8. Hanging Banners: 2 Vertical Planes with Vibrant Colors (West & East Walls)
  // Banner 1: West Wall (Royal Blue with Gold text)
  const banner1Tex = createTextCanvasTexture('MEMBACA JAMBATAN ILMU', '#1E40AF', '#FEF3C7', 512, 768, 42, 'Koleksi Simpulan Bahasa Melayu');
  const banner1 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.0), new THREE.MeshBasicMaterial({ map: banner1Tex, side: THREE.DoubleSide }));
  banner1.rotation.y = Math.PI / 2;
  banner1.position.set(cx - 12.65, 3.4, cz - 5.5);
  roomGroup.add(banner1);

  // Hanging rod for Banner 1
  const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  rod1.rotation.x = Math.PI / 2;
  rod1.position.set(cx - 12.62, 5.4, cz - 5.5);
  roomGroup.add(rod1);

  // Banner 2: East Wall (Crimson with Gold text)
  const banner2Tex = createTextCanvasTexture('BANGSA MEMBACA BANGSA BERJAYA', '#991B1B', '#FEF08A', 512, 768, 42, 'Pusat Sumber Jawi Bestari');
  const banner2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.0), new THREE.MeshBasicMaterial({ map: banner2Tex, side: THREE.DoubleSide }));
  banner2.rotation.y = -Math.PI / 2;
  banner2.position.set(cx + 12.65, 3.4, cz - 5.5);
  roomGroup.add(banner2);

  // Hanging rod for Banner 2
  const rod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  rod2.rotation.x = Math.PI / 2;
  rod2.position.set(cx + 12.62, 5.4, cz - 5.5);
  roomGroup.add(rod2);

  // 9. Book Return Trolley: 2-Tier Trolley with Grey Boxes & Small Black Cylinder Wheels
  const trolleyGroup = new THREE.Group();
  trolleyGroup.position.set(cx - 11.2, 0, cz - 6.5);

  const metalGreyMat = new THREE.MeshLambertMaterial({ color: 0x64748B });
  const darkFrameMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x0F172A });

  // 4 Vertical Uprights
  [[-0.32, -0.65], [0.32, -0.65], [-0.32, 0.65], [0.32, 0.65]].forEach(([ux, uz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.15, 0.05), darkFrameMat);
    post.position.set(ux, 0.58, uz);
    trolleyGroup.add(post);
  });

  // Top Handle Push Bar
  const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.4), darkFrameMat);
  handleBar.position.set(0.32, 1.15, 0);
  trolleyGroup.add(handleBar);

  // Bottom Tier Shelf
  const shelfBottom = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 1.35), metalGreyMat);
  shelfBottom.position.set(0, 0.35, 0);
  trolleyGroup.add(shelfBottom);

  // Top Tier Shelf
  const shelfTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 1.35), metalGreyMat);
  shelfTop.position.set(0, 0.82, 0);
  trolleyGroup.add(shelfTop);

  // 4 Black Caster Wheels
  [[-0.3, -0.6], [0.3, -0.6], [-0.3, 0.6], [0.3, 0.6]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.06, wz);
    trolleyGroup.add(wheel);
  });

  // Stack of colorful books on trolley shelves
  const tColors = [0xDC2626, 0x2563EB, 0x16A34A, 0xF59E0B, 0x9333EA];
  for (let k = 0; k < 4; k++) {
    const bTop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.08), new THREE.MeshLambertMaterial({ color: tColors[k] }));
    bTop.position.set(-0.05, 0.98, -0.4 + k * 0.26);
    bTop.rotation.y = 0.08 * (k % 2 === 0 ? 1 : -1);
    trolleyGroup.add(bTop);

    const bBottom = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.08), new THREE.MeshLambertMaterial({ color: tColors[(k + 2) % tColors.length] }));
    bBottom.position.set(0.05, 0.50, -0.4 + k * 0.26);
    trolleyGroup.add(bBottom);
  }

  roomGroup.add(trolleyGroup);
  roomColliders.push({ minX: cx - 11.8, maxX: cx - 10.6, minZ: cz - 7.4, maxZ: cz - 5.6 });

  // 10. Central Reading Table Station (r3AssemblyStation) at (300.0, 296.0)
  const stationGroup = new THREE.Group();
  stationGroup.position.set(300.0, 0, 296.0);

  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 2.4), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  tableTop.position.y = 1.0;
  tableTop.castShadow = true;
  stationGroup.add(tableTop);

  // 4 Table Legs
  [[-1.9, -1.0], [1.9, -1.0], [-1.9, 1.0], [1.9, 1.0]].forEach(([lx, lz]) => {
    const tLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), new THREE.MeshLambertMaterial({ color: 0x592911 }));
    tLeg.position.set(lx, 0.45, lz);
    stationGroup.add(tLeg);
  });

  // Open illuminated book on table
  const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.6), new THREE.MeshStandardMaterial({ color: 0xFFFDF0 }));
  bookMesh.position.set(0, 1.12, 0);
  stationGroup.add(bookMesh);

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

  roomGroup.add(stationGroup);
  roomColliders.push({ minX: 297.8, maxX: 302.2, minZ: 294.6, maxZ: 297.4 });

  return {
    r3AssemblyStation: { group: stationGroup, beacon },
    spawnR3Scrolls
  };
}

/**
 * Spawns 3D Rolled Parchment Scrolls for Room 3
 */
export function spawnR3Scrolls(items, targetGroup) {
  items.forEach((item) => {
    const itemGroup = new THREE.Group();
    itemGroup.position.set(item.pos.x, item.pos.y, item.pos.z);

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

    scrollGroup.castShadow = true;
    itemGroup.add(scrollGroup);

    // Glowing point light
    const light = new THREE.PointLight(item.color, 1.5, 5);
    itemGroup.add(light);

    item.mesh = itemGroup;
    item.gemMesh = scrollGroup;
    item.ringMesh = null;
    item.pointLight = light;
    item.isPopping = false;
    item.popScale = 1.0;

    targetGroup.add(itemGroup);
  });
}
