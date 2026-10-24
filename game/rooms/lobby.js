// ==========================================
// ROOMS/LOBBY.JS - Dataran Perhimpunan Sekolah Bestari (Lobby at 0, 0)
// ==========================================
import { createTextCanvasTexture, createNoticeboardTexture, createTextSprite, buildCutawayRoomShell, resolveRoomArgs } from './helpers.js';
 
export function buildLobby(arg1, arg2, arg3) {
  const { targetGroup: roomGroup, collidersList: roomColliders } = resolveRoomArgs(arg1, arg2, arg3);
  const cx = 0, cz = 0;
  buildCutawayRoomShell(roomGroup, roomColliders, cx, cz, 0xE2E8F0, 0x1E3A8A, 0x1E40AF, 0x64748B);

  // 1. School Hall Arch & Facade Banner on North Wall
  const bannerTex = createTextCanvasTexture(
    'KEMBARA BAHASA SEKOLAH BESTARI',
    '#1E3A8A',
    '#FFFFFF',
    1024,
    256,
    48,
    'Inovasi Digital PdP Bahasa Melayu • Standard Pembelajaran 4.4.2'
  );
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(16.5, 3.8),
    new THREE.MeshBasicMaterial({ map: bannerTex })
  );
  bannerMesh.position.set(cx, 3.6, cz - 10.7);
  roomGroup.add(bannerMesh);

  // 2. Jalur Gemilang Flagpole with Raised Stone Base
  const poleBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), new THREE.MeshLambertMaterial({ color: 0xCBD5E1 }));
  poleBase.position.set(-8.5, 0.45, -5.5);
  roomGroup.add(poleBase);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7.5, 12), new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.8 }));
  pole.position.set(-8.5, 4.0, -5.5);
  roomGroup.add(pole);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.04), new THREE.MeshLambertMaterial({ color: 0xDC2626 }));
  flag.position.set(-7.5, 6.9, -5.5);
  roomGroup.add(flag);

  roomColliders.push({ minX: -9.5, maxX: -7.5, minZ: -6.5, maxZ: -4.5 });

  // 3. Red Ceremonial Carpet Leading Across Dataran
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 16.0),
    new THREE.MeshLambertMaterial({ color: 0x991B1B })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.22, 1.0);
  roomGroup.add(carpet);

  // 4. Dataran Flower Planters & Shrubbery
  [-9.5, 9.5].forEach((px) => {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 2.0), new THREE.MeshLambertMaterial({ color: 0x78350F }));
    planter.position.set(px, 0.6, 4.0);
    roomGroup.add(planter);

    const bush = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), new THREE.MeshLambertMaterial({ color: 0x15803D }));
    bush.position.set(px, 1.5, 4.0);
    roomGroup.add(bush);

    // Flowers
    const flowers = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshLambertMaterial({ color: 0xEF4444 }));
    flowers.position.set(px, 2.2, 4.0);
    roomGroup.add(flowers);

    roomColliders.push({ minX: px - 1.2, maxX: px + 1.2, minZ: 2.8, maxZ: 5.2 });
  });

  // 5. School Noticeboard with Announcement (Enlarged Full Stand)
  const noticeboard = new THREE.Group();
  noticeboard.position.set(-9.2, 0, -1.0);
  noticeboard.rotation.y = Math.PI / 2 - 0.22; // Slightly angled towards the courtyard path

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

  // 6. Courtyard Wooden Benches
  [
    { x: -5.5, z: -6.0 },
    { x: 5.5, z: -6.0 }
  ].forEach(({ x, z }) => {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.8), new THREE.MeshLambertMaterial({ color: 0x92400E }));
    bench.position.set(x, 0.5, z);
    roomGroup.add(bench);
    roomColliders.push({ minX: x - 1.3, maxX: x + 1.3, minZ: z - 0.5, maxZ: z + 0.5 });
  });

  // 7. NPC Cikgu Aminah (Guru Bahasa Melayu)
  const teacherGroup = new THREE.Group();
  teacherGroup.position.set(2.0, 0, -3.2);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.52, 0.95, 12), new THREE.MeshLambertMaterial({ color: 0x047857 }));
  skirt.position.y = 0.65;
  teacherGroup.add(skirt);

  const bajuKurung = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.44), new THREE.MeshLambertMaterial({ color: 0x10B981 }));
  bajuKurung.position.y = 1.35;
  teacherGroup.add(bajuKurung);

  const tudung = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), new THREE.MeshLambertMaterial({ color: 0xFEF08A }));
  tudung.position.y = 1.95;
  teacherGroup.add(tudung);

  const face = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.12), new THREE.MeshLambertMaterial({ color: 0xFDE68A }));
  face.position.set(0, 1.9, 0.26);
  teacherGroup.add(face);

  const armL = new THREE.Group();
  armL.position.set(-0.44, 1.55, 0);
  const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), new THREE.MeshLambertMaterial({ color: 0x10B981 }));
  sleeveL.position.y = -0.22;
  armL.add(sleeveL);
  teacherGroup.add(armL);

  const teacherTag = createTextSprite('Cikgu Asyikin (Guru BM)', 'rgba(6, 78, 59, 0.94)', '#A7F3D0', 512, 160, 52);
  teacherTag.scale.set(3.0, 1.4, 1);
  teacherTag.position.set(0, 2.7, 0);
  teacherGroup.add(teacherTag);

  roomGroup.add(teacherGroup);
  roomColliders.push({ minX: 1.0, maxX: 3.0, minZ: -4.2, maxZ: -2.2 });

  return {
    teacherWavingArm: armL,
    teacherHead: tudung
  };
}
