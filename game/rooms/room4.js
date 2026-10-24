// ==========================================
// ROOMS/ROOM4.JS - Studio Persembahan Seni Khat (Art Studio at 400, 400 - SP 4.4.2)
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
    'Standard Pembelajaran 4.4.2 • Mempersembahkan Keindahan Seni Tulisan Jawi'
  );
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(14.0, 3.2), new THREE.MeshBasicMaterial({ map: artTex }));
  bannerMesh.position.set(cx, 3.4, cz - 10.7);
  roomGroup.add(bannerMesh);

  // 2. Artistic Paint Splatter Decals on Walls
  const splatterCanvas = document.createElement('canvas');
  splatterCanvas.width = 512;
  splatterCanvas.height = 512;
  const sCtx = splatterCanvas.getContext('2d');
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  for (let i = 0; i < 40; i++) {
    sCtx.fillStyle = colors[i % colors.length];
    sCtx.beginPath();
    const sx = Math.random() * 512, sy = Math.random() * 512, sr = 6 + Math.random() * 22;
    sCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    sCtx.fill();
  }
  const splatterTex = new THREE.CanvasTexture(splatterCanvas);

  const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 3.0), new THREE.MeshBasicMaterial({ map: splatterTex, transparent: true, opacity: 0.65 }));
  decalMesh.position.set(cx - 5.0, 2.5, cz - 10.65);
  roomGroup.add(decalMesh);

  // 3. Perimeter Wall Furniture: Art Supply Cabinet along West Wall
  const supplyCabinet = new THREE.Group();
  supplyCabinet.position.set(cx - 12.0, 0, cz + 2.0);
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.6, 3.2), new THREE.MeshLambertMaterial({ color: 0x78350F }));
  cabBody.position.y = 1.3;
  supplyCabinet.add(cabBody);
  roomGroup.add(supplyCabinet);
  roomColliders.push({ minX: cx - 12.6, maxX: cx - 11.2, minZ: cz + 0.2, maxZ: cz + 3.8 });

  // 4. Perimeter Wall Furniture: Student Exhibition Shelving along North Wall Edge
  const exhibitionShelf = new THREE.Group();
  exhibitionShelf.position.set(cx + 7.5, 0, cz - 10.2);
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
  roomColliders.push({ minX: cx + 5.5, maxX: cx + 9.5, minZ: cz - 10.8, maxZ: cz - 9.5 });

  // 5. Perimeter Wall Furniture: Calligraphy Tool Storage along East Wall
  const eastRack = new THREE.Group();
  eastRack.position.set(cx + 12.0, 0, cz + 2.0);
  const rackBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 2.8), new THREE.MeshLambertMaterial({ color: 0xB45309 }));
  rackBody.position.y = 1.0;
  eastRack.add(rackBody);
  roomGroup.add(eastRack);
  roomColliders.push({ minX: cx + 11.2, maxX: cx + 12.6, minZ: cz + 0.5, maxZ: cz + 3.5 });

  // 5. Central Masterpiece Assembly Station (r4AssemblyStation) at (400.0, 395.5)
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

      const goldBorder = new THREE.Mesh(
        new THREE.BoxGeometry(0.86, 1.14, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.75 })
      );
      goldBorder.position.z = 0.03;
      supplyGroup.add(goldBorder);
    }

    supplyGroup.scale.set(1.4, 1.4, 1.4);
    supplyGroup.castShadow = true;
    itemGroup.add(supplyGroup);

    const toolTag = createTextSprite(
      `${item.char} ${item.name}`,
      'rgba(15, 23, 42, 0.94)',
      '#FDE047',
      512,
      180,
      56
    );
    toolTag.scale.set(3.4, 1.6, 1);
    toolTag.position.set(0, 1.7, 0);
    itemGroup.add(toolTag);

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

