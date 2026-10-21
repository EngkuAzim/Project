// ==========================================
// ROOMS/ROOM3.JS - Arkib Simpulan Bahasa (Library at 300, 300)
// ==========================================
import { createTextCanvasTexture, createTextSprite, buildCutawayRoomShell, resolveRoomArgs } from './helpers.js';

export function buildRoom3(arg1, arg2, arg3) {
  const { targetGroup: roomGroup, collidersList: roomColliders } = resolveRoomArgs(arg1, arg2, arg3);
  const cx = 300, cz = 300;
  buildCutawayRoomShell(roomGroup, roomColliders, cx, cz, 0x451A03, 0x78350F, 0x92400E, 0xD97706);

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

  // 2. Tall Teak Bookshelves along North Wall
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

  // 3. Sudut Nilam (Reading Corner with Circular Rug & Beanbags)
  const sudutNilamGroup = new THREE.Group();
  sudutNilamGroup.position.set(cx - 7.5, 0, cz + 4.5);

  const nilamRug = new THREE.Mesh(
    new THREE.CircleGeometry(3.0, 24),
    new THREE.MeshLambertMaterial({ color: 0x059669 })
  );
  nilamRug.rotation.x = -Math.PI / 2;
  nilamRug.position.y = 0.22;
  sudutNilamGroup.add(nilamRug);

  // Colorful Beanbags
  const beanColors = [0xF59E0B, 0x3B82F6, 0xEC4899];
  [-1.4, 0, 1.4].forEach((bx, idx) => {
    const beanbag = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 12, 10),
      new THREE.MeshLambertMaterial({ color: beanColors[idx] })
    );
    beanbag.scale.set(1.1, 0.65, 1.1);
    beanbag.position.set(bx, 0.45, (idx === 1) ? 0.8 : -0.4);
    sudutNilamGroup.add(beanbag);
  });

  const nilamSignTex = createTextCanvasTexture('SUDUT NILAM BESTARI', '#064E3B', '#FDE68A', 512, 160, 40, 'Membaca Jambatan Ilmu');
  const nilamSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.8), new THREE.MeshBasicMaterial({ map: nilamSignTex }));
  nilamSign.position.set(0, 1.8, -2.5);
  sudutNilamGroup.add(nilamSign);

  roomGroup.add(sudutNilamGroup);
  roomColliders.push({ minX: cx - 10.0, maxX: cx - 5.0, minZ: cz + 2.0, maxZ: cz + 7.0 });

  // 4. Librarian Circulation Counter (Kaunter Pustakawan)
  const counterGroup = new THREE.Group();
  counterGroup.position.set(cx + 7.5, 0, cz + 4.5);

  const cDesk = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.1, 1.4), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  cDesk.position.y = 0.55;
  counterGroup.add(cDesk);

  const cTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 1.6), new THREE.MeshLambertMaterial({ color: 0xD97706 }));
  cTop.position.y = 1.12;
  counterGroup.add(cTop);

  // Computer monitor on counter
  const mon = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.08), new THREE.MeshStandardMaterial({ color: 0x1E293B }));
  mon.position.set(-0.8, 1.42, 0);
  counterGroup.add(mon);

  roomGroup.add(counterGroup);
  roomColliders.push({ minX: cx + 5.2, maxX: cx + 9.8, minZ: cz + 3.5, maxZ: cz + 5.5 });

  // 5. Wooden Book Trolley (Troli Buku)
  const trolley = new THREE.Group();
  trolley.position.set(cx - 3.5, 0, cz - 4.5);
  const trolleyBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.8), new THREE.MeshLambertMaterial({ color: 0xB45309 }));
  trolleyBody.position.y = 0.7;
  trolley.add(trolleyBody);
  roomGroup.add(trolley);
  roomColliders.push({ minX: cx - 4.5, maxX: cx - 2.5, minZ: cz - 5.2, maxZ: cz - 3.8 });

  // 6. Central Reading Table Station (r3AssemblyStation) at (300.0, 296.0)
  const stationGroup = new THREE.Group();
  stationGroup.position.set(300.0, 0, 296.0);

  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 2.4), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  tableTop.position.y = 1.0;
  tableTop.castShadow = true;
  stationGroup.add(tableTop);

  // Open illuminated book on table
  const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.6), new THREE.MeshStandardMaterial({ color: 0xFFFDF0 }));
  bookMesh.position.set(0, 1.12, 0);
  stationGroup.add(bookMesh);

  // Brass Banker's Lamp
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 8), new THREE.MeshStandardMaterial({ color: 0x15803D, metalness: 0.6 }));
  lamp.position.set(1.4, 1.3, 0);
  stationGroup.add(lamp);

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
    item.gemMesh = scrollGroup;
    item.ringMesh = ring;
    item.pointLight = light;
    item.isPopping = false;
    item.popScale = 1.0;

    targetGroup.add(itemGroup);
  });
}

