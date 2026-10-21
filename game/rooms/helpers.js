// ==========================================
// ROOMS/HELPERS.JS - Shared Cached Geometries, Materials & CanvasTexture Engine
// ==========================================

// Global Cache Maps to eliminate GPU allocation lag during gameplay
const canvasTextureCache = new Map();
const spriteTextureCache = new Map();
const illustratedCardCache = new Map();
const jawiTileCache = new Map();

/**
 * Normalizes builder arguments so builders can be called as:
 * - buildRoom(roomGroup, colliders)
 * - buildRoom(scene, roomGroup, colliders)
 * - buildRoom(scene, colliders)
 */
export function resolveRoomArgs(arg1, arg2, arg3) {
  let targetGroup, collidersList;
  if (arg1 && arg1.isGroup && Array.isArray(arg2)) {
    targetGroup = arg1;
    collidersList = arg2;
  } else if (arg2 && arg2.isGroup) {
    targetGroup = arg2;
    collidersList = arg3 || [];
  } else {
    targetGroup = arg1;
    collidersList = Array.isArray(arg2) ? arg2 : (arg3 || []);
  }
  return { targetGroup, collidersList };
}

/**
 * Creates or retrieves a cached CanvasTexture for 3D signage boards.
 */
export function createTextCanvasTexture(text, bgColor = '#1E3A8A', textColor = '#FFFFFF', width = 1024, height = 256, fontSize = 56, subtitle = '') {
  const cacheKey = `${text}_${bgColor}_${textColor}_${width}_${height}_${fontSize}_${subtitle}`;
  if (canvasTextureCache.has(cacheKey)) {
    return canvasTextureCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Outer Gold Decorative Border
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  // Inner Accent Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Text Styling
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px "Fredoka", "Plus Jakarta Sans", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (subtitle) {
    ctx.fillText(text, width / 2, height / 2 - fontSize * 0.32);
    ctx.fillStyle = '#FDE68A';
    ctx.font = `600 ${Math.round(fontSize * 0.44)}px "Plus Jakarta Sans", Arial, sans-serif`;
    ctx.fillText(subtitle, width / 2, height / 2 + fontSize * 0.52);
  } else {
    ctx.fillText(text, width / 2, height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  canvasTextureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates or retrieves a cached floating 3D text sprite with rounded pill background.
 */
export function createTextSprite(text, bgColor = 'rgba(15, 23, 42, 0.94)', textColor = '#FFFFFF', width = 512, height = 180, fontSize = 64) {
  const cacheKey = `${text}_${bgColor}_${textColor}_${width}_${height}_${fontSize}`;
  let texture;

  if (spriteTextureCache.has(cacheKey)) {
    texture = spriteTextureCache.get(cacheKey);
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Rounded Pill Background
    const r = height / 2 - 10;
    const x = 12, y = 10, w = width - 24, h = height - 20;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = bgColor;
    ctx.fill();

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px "Fredoka", "Plus Jakarta Sans", "Amiri", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    spriteTextureCache.set(cacheKey, texture);
  }

  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  return new THREE.Sprite(spriteMat);
}

/**
 * Creates or retrieves a cached 3D Jawi Alphabet Tile texture.
 */
export function createJawiTileTexture(char, name, colorHex = '#2563EB') {
  const cacheKey = `${char}_${name}_${colorHex}`;
  if (jawiTileCache.has(cacheKey)) {
    return jawiTileCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Parchment gradient background
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#FFFBEB');
  grad.addColorStop(1, '#FEF3C7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Double border
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 18;
  ctx.strokeRect(16, 16, 480, 480);

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 6;
  ctx.strokeRect(32, 32, 448, 448);

  // Large Calligraphic Jawi Character
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 200px "Amiri", "Traditional Arabic", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 256, 215);

  // Rumi Name Banner
  ctx.fillStyle = colorHex;
  ctx.fillRect(40, 390, 432, 85);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 44px "Fredoka", "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(name.toUpperCase(), 256, 435);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  jawiTileCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates or retrieves a cached Illustrated Picture & Word Card Texture (Room 2).
 */
export function createIllustratedCardTexture(item) {
  const cacheKey = item.id;
  if (illustratedCardCache.has(cacheKey)) {
    return illustratedCardCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  // Card Background: Off-white parchment
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 640);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(1, '#FFFBEB');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 640);

  // Gold Card Border
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 14;
  ctx.strokeRect(12, 12, 488, 616);

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, 460, 588);

  // Top Jawi Banner
  const hexColor = '#' + item.color.toString(16).padStart(6, '0');
  ctx.fillStyle = hexColor;
  ctx.fillRect(36, 36, 440, 110);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 74px "Amiri", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.jawi, 256, 92);

  // Center Circular Spotlight for Emoji / Illustration
  ctx.beginPath();
  ctx.arc(256, 310, 125, 0, Math.PI * 2);
  ctx.fillStyle = '#FEF3C7';
  ctx.fill();
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Big Cute Emoji Illustration
  ctx.font = '130px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.char, 256, 315);

  // Rumi Word Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 56px "Fredoka", "Plus Jakarta Sans", sans-serif';
  ctx.fillText(item.rumi.toUpperCase(), 256, 485);

  // Letters breakdown pill (e.g., "ا • و • ل • ت")
  ctx.fillStyle = '#1E293B';
  const pillW = 380, pillH = 50, pillX = 66, pillY = 535, pillR = 25;
  ctx.beginPath();
  ctx.moveTo(pillX + pillR, pillY);
  ctx.lineTo(pillX + pillW - pillR, pillY);
  ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + pillR);
  ctx.lineTo(pillX + pillW, pillY + pillH - pillR);
  ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - pillR, pillY + pillH);
  ctx.lineTo(pillX + pillR, pillY + pillH);
  ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - pillR);
  ctx.lineTo(pillX, pillY + pillR);
  ctx.quadraticCurveTo(pillX, pillY, pillX + pillR, pillY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 30px "Amiri", sans-serif';
  ctx.fillText(item.letters.join('  •  '), 256, 560);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  illustratedCardCache.set(cacheKey, texture);
  return texture;
}

/**
 * Builds a cutaway diorama shell (floor + north wall + west wall) inside targetGroup
 * and registers wall colliders in roomColliders.
 */
export function buildCutawayRoomShell(targetGroup, roomColliders, cx, cz, floorColor, northWallColor, westWallColor, trimColor = 0xA0AEC0, width = 26, depth = 22) {
  const hw = width / 2;
  const hd = depth / 2;

  // Floor Platform
  const floorGeo = new THREE.BoxGeometry(width, 0.4, depth);
  const floorMat = new THREE.MeshLambertMaterial({ color: floorColor });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(cx, 0.2, cz);
  floorMesh.receiveShadow = true;
  targetGroup.add(floorMesh);

  // Outer Platform Base
  const baseGeo = new THREE.BoxGeometry(width + 0.8, 0.6, depth + 0.8);
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.set(cx, -0.1, cz);
  targetGroup.add(baseMesh);

  // North Back Wall (z = cz - hd)
  const nWallGeo = new THREE.BoxGeometry(width, 5.5, 0.5);
  const nWallMat = new THREE.MeshLambertMaterial({ color: northWallColor });
  const nWallMesh = new THREE.Mesh(nWallGeo, nWallMat);
  nWallMesh.position.set(cx, 2.95, cz - hd);
  nWallMesh.castShadow = true;
  nWallMesh.receiveShadow = true;
  targetGroup.add(nWallMesh);

  // West Side Wall (x = cx - hw)
  const wWallGeo = new THREE.BoxGeometry(0.5, 5.5, depth);
  const wWallMat = new THREE.MeshLambertMaterial({ color: westWallColor });
  const wWallMesh = new THREE.Mesh(wWallGeo, wWallMat);
  wWallMesh.position.set(cx - hw, 2.95, cz);
  wWallMesh.castShadow = true;
  wWallMesh.receiveShadow = true;
  targetGroup.add(wWallMesh);

  // Wall Baseboards / Trims
  const nTrim = new THREE.Mesh(new THREE.BoxGeometry(width, 0.35, 0.55), new THREE.MeshLambertMaterial({ color: trimColor }));
  nTrim.position.set(cx, 0.55, cz - hd);
  targetGroup.add(nTrim);

  const wTrim = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, depth), new THREE.MeshLambertMaterial({ color: trimColor }));
  wTrim.position.set(cx - hw, 0.55, cz);
  targetGroup.add(wTrim);

  // Register physical collision boxes for walls
  roomColliders.push({ minX: cx - hw - 0.5, maxX: cx + hw + 0.5, minZ: cz - hd - 0.5, maxZ: cz - hd + 0.5 });
  roomColliders.push({ minX: cx - hw - 0.5, maxX: cx - hw + 0.5, minZ: cz - hd - 0.5, maxZ: cz + hd + 0.5 });
}
