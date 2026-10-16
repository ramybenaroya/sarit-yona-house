import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { LEVELS } from './plan.js';
import { paintingTexture, welcomeScreenTexture } from './materials.js';

// ---------------------------------------------------------------------------
// Primitive helpers (all sizes in meters, objects sit on y = 0 unless noted)
// ---------------------------------------------------------------------------
function mesh(geo, mat, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

// box spanning absolute ranges [x0,x1] [y0,y1] [z0,z1]
function bx(x0, y0, z0, x1, y1, z1, mat, r = 0) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const geo = r > 0
    ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2))
    : new THREE.BoxGeometry(w, h, d);
  const m = mesh(geo, mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return m;
}

// centred box: size + centre
function cb(w, h, d, x, y, z, mat, r = 0) {
  return bx(x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2, mat, r);
}

function cyl(rt, rb, h, x, y, z, mat, seg = 24) {
  const m = mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

function group(x = 0, y = 0, z = 0, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  return g;
}

// Rotation helpers: furniture is modelled facing +z ("front" toward +z).
const FACE = { south: 0, north: Math.PI, east: Math.PI / 2, west: -Math.PI / 2 };

// ---------------------------------------------------------------------------
// Furniture pieces (local coordinates, facing +z)
// ---------------------------------------------------------------------------
function sofa(M, len, depth, { chaise = 0, chaiseSide = -1, mat = M.fabricSofa, cushions = [] } = {}) {
  const g = new THREE.Group();
  const seatH = 0.42, backH = 0.82, arm = 0.16;
  const z0 = -depth / 2, z1 = depth / 2;
  // base
  g.add(bx(-len / 2, 0.08, z0, len / 2, seatH - 0.12, z1, mat, 0.04));
  // back
  g.add(bx(-len / 2, 0.08, z0, len / 2, backH, z0 + 0.2, mat, 0.06));
  // arms
  if (!(chaise && chaiseSide < 0)) g.add(bx(-len / 2, 0.08, z0, -len / 2 + arm, 0.62, z1, mat, 0.06));
  if (!(chaise && chaiseSide > 0)) g.add(bx(len / 2 - arm, 0.08, z0, len / 2, 0.62, z1, mat, 0.06));
  // seat cushions
  const inner0 = -len / 2 + (chaise && chaiseSide < 0 ? 0 : arm);
  const inner1 = len / 2 - (chaise && chaiseSide > 0 ? 0 : arm);
  const n = Math.max(2, Math.round((inner1 - inner0) / 0.85));
  const cw = (inner1 - inner0) / n;
  for (let i = 0; i < n; i++) {
    g.add(bx(inner0 + i * cw + 0.005, seatH - 0.12, z0 + 0.2, inner0 + (i + 1) * cw - 0.005, seatH + 0.02, z1 - 0.01, mat, 0.05));
    // back cushions
    const bc = bx(inner0 + i * cw + 0.01, seatH, z0 + 0.12, inner0 + (i + 1) * cw - 0.01, backH + 0.05, z0 + 0.34, mat, 0.08);
    bc.rotation.x = -0.12;
    g.add(bc);
  }
  if (chaise) {
    const cx0 = chaiseSide < 0 ? -len / 2 : len / 2 - chaise;
    const cx1 = cx0 + chaise;
    g.add(bx(cx0, 0.08, z1, cx1, seatH - 0.12, z1 + 0.75, mat, 0.04));
    g.add(bx(cx0 + 0.005, seatH - 0.12, z1 - 0.01, cx1 - 0.005, seatH + 0.02, z1 + 0.74, mat, 0.05));
    const ax = chaiseSide < 0 ? cx0 : cx1 - arm;
    g.add(bx(ax, 0.08, z0, ax + arm, 0.62, z1 + 0.75, mat, 0.06));
  }
  // legs
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(cyl(0.018, 0.014, 0.08, sx * (len / 2 - 0.08), 0.04, sz * (depth / 2 - 0.08), M.blackMetal, 8));
  }
  // throw cushions
  cushions.forEach((c, i) => {
    const p = cb(0.45, 0.42, 0.14, c.x, seatH + 0.22, z0 + 0.36, c.mat, 0.06);
    p.rotation.x = -0.25;
    p.rotation.z = (i % 2 ? 1 : -1) * 0.08;
    g.add(p);
  });
  return g;
}

function armchair(M, mat) {
  const g = new THREE.Group();
  g.add(bx(-0.38, 0.12, -0.36, 0.38, 0.4, 0.36, mat, 0.06));
  g.add(bx(-0.38, 0.12, -0.36, 0.38, 0.85, -0.18, mat, 0.08));
  g.add(bx(-0.38, 0.12, -0.36, -0.26, 0.6, 0.36, mat, 0.05));
  g.add(bx(0.26, 0.12, -0.36, 0.38, 0.6, 0.36, mat, 0.05));
  g.add(bx(-0.26, 0.38, -0.18, 0.26, 0.48, 0.34, mat, 0.05));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = cyl(0.015, 0.012, 0.14, sx * 0.3, 0.06, sz * 0.28, M.veneerDark, 8);
    g.add(l);
  }
  return g;
}

function table(M, w, d, h, { top = M.veneer, legs = M.blackMetal, round = false, thick = 0.035 } = {}) {
  const g = new THREE.Group();
  if (round) {
    g.add(cyl(w / 2, w / 2, thick, 0, h - thick / 2, 0, top, 40));
    g.add(cyl(0.03, 0.03, h - thick, 0, (h - thick) / 2, 0, legs, 12));
    g.add(cyl(0.22, 0.24, 0.02, 0, 0.01, 0, legs, 24));
  } else {
    g.add(bx(-w / 2, h - thick, -d / 2, w / 2, h, d / 2, top, 0.008));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(bx(sx * (w / 2 - 0.06) - 0.02, 0, sz * (d / 2 - 0.06) - 0.02, sx * (w / 2 - 0.06) + 0.02, h - thick, sz * (d / 2 - 0.06) + 0.02, legs));
    }
  }
  return g;
}

function chair(M, seatMat = M.veneer, frame = M.blackMetal) {
  const g = new THREE.Group();
  g.add(bx(-0.22, 0.43, -0.22, 0.22, 0.47, 0.22, seatMat, 0.01));
  g.add(bx(-0.21, 0.6, -0.24, 0.21, 0.85, -0.2, seatMat, 0.01));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(bx(sx * 0.19 - 0.012, 0, sz * 0.19 - 0.012, sx * 0.19 + 0.012, 0.43, sz * 0.19 + 0.012, frame));
  }
  g.add(bx(-0.21, 0.47, -0.235, -0.18, 0.85, -0.205, frame));
  g.add(bx(0.18, 0.47, -0.235, 0.21, 0.85, -0.205, frame));
  return g;
}

function stool(M) {
  const g = new THREE.Group();
  g.add(cyl(0.19, 0.17, 0.06, 0, 0.66, 0, M.veneer, 28));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const l = cyl(0.012, 0.012, 0.68, Math.cos(a) * 0.13, 0.33, Math.sin(a) * 0.13, M.blackMetal, 8);
    l.rotation.z = Math.cos(a) * 0.1;
    l.rotation.x = -Math.sin(a) * 0.1;
    g.add(l);
  }
  const ring = mesh(new THREE.TorusGeometry(0.15, 0.008, 6, 28), M.blackMetal);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.25;
  g.add(ring);
  return g;
}

function bed(M, w, len, { duvet = M.linen, throwMat = M.fabricTerra, head = M.fabricSofa, headH = 0.95 } = {}) {
  // headboard at local -z, foot toward +z
  const g = new THREE.Group();
  const z0 = -len / 2, z1 = len / 2;
  g.add(bx(-w / 2 - 0.04, 0.06, z0 + 0.06, w / 2 + 0.04, 0.32, z1 + 0.02, head, 0.04));
  g.add(bx(-w / 2 - 0.08, 0.06, z0, w / 2 + 0.08, headH, z0 + 0.09, head, 0.04));
  g.add(bx(-w / 2, 0.32, z0 + 0.1, w / 2, 0.55, z1, M.linen, 0.07));
  // duvet with soft fold
  const dv = bx(-w / 2 - 0.03, 0.5, z0 + 0.55, w / 2 + 0.03, 0.6, z1 + 0.03, duvet, 0.05);
  g.add(dv);
  g.add(bx(-w / 2 - 0.02, 0.58, z0 + 0.55, w / 2 + 0.02, 0.63, z0 + 0.8, duvet, 0.03));
  // throw blanket at the foot
  g.add(bx(-w / 2 - 0.035, 0.595, z1 - 0.55, w / 2 + 0.035, 0.625, z1 + 0.035, throwMat, 0.012));
  // pillows
  const np = w > 1.3 ? 2 : 1;
  for (let i = 0; i < np; i++) {
    const px = np === 1 ? 0 : (i - 0.5) * (w / 2);
    const p = cb(w / np - 0.12, 0.16, 0.42, px, 0.66, z0 + 0.36, M.linen, 0.07);
    p.rotation.x = -0.35;
    g.add(p);
    const p2 = cb(0.42, 0.36, 0.12, px, 0.72, z0 + 0.52, throwMat, 0.05);
    p2.rotation.x = -0.25;
    g.add(p2);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(cyl(0.02, 0.02, 0.06, sx * (w / 2 - 0.05), 0.03, sz * (len / 2 - 0.08), M.veneerDark, 8));
  }
  return g;
}

function nightstand(M, lights, lamp = true) {
  const g = new THREE.Group();
  g.add(bx(-0.24, 0.12, -0.2, 0.24, 0.52, 0.2, M.veneer, 0.01));
  g.add(bx(-0.22, 0.29, 0.199, 0.22, 0.31, 0.205, M.veneerDark));
  for (const sx of [-1, 1]) g.add(bx(sx * 0.2 - 0.012, 0, -0.16, sx * 0.2 + 0.012, 0.12, 0.16, M.blackMetal));
  if (lamp) {
    const l = tableLamp(M, lights);
    l.position.set(0.05, 0.52, -0.02);
    g.add(l);
  }
  return g;
}

function tableLamp(M, lights) {
  const g = new THREE.Group();
  g.add(cyl(0.07, 0.09, 0.2, 0, 0.1, 0, M.ceramic, 20));
  g.add(cyl(0.008, 0.008, 0.12, 0, 0.26, 0, M.brass, 8));
  const shade = cyl(0.1, 0.15, 0.18, 0, 0.38, 0, M.lampShade, 28);
  shade.castShadow = false;
  g.add(shade);
  const light = new THREE.PointLight(0xffc98a, 0, 3.5, 2);
  light.position.set(0, 0.36, 0);
  light.userData.night = 2.2;
  g.add(light);
  lights.push(light);
  return g;
}

function floorLamp(M, lights) {
  const g = new THREE.Group();
  g.add(cyl(0.16, 0.17, 0.025, 0, 0.012, 0, M.blackMetal, 24));
  g.add(cyl(0.012, 0.012, 1.45, 0, 0.75, 0, M.blackMetal, 8));
  const shade = cyl(0.18, 0.24, 0.32, 0, 1.55, 0, M.lampShade, 28);
  shade.castShadow = false;
  g.add(shade);
  const light = new THREE.PointLight(0xffc98a, 0, 5, 2);
  light.position.set(0, 1.5, 0);
  light.userData.night = 6;
  g.add(light);
  lights.push(light);
  return g;
}

function pendant(M, lights, drop, { r = 0.16, mat = M.blackMetal, light = true, intensity = 4 } = {}) {
  // hangs from y = 0 downward
  const g = new THREE.Group();
  g.add(cyl(0.004, 0.004, drop, 0, -drop / 2, 0, M.blackMetal, 6));
  const shade = mesh(new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  shade.material.side = THREE.DoubleSide;
  shade.position.y = -drop - 0.02;
  shade.scale.y = 0.7;
  g.add(shade);
  const bulb = mesh(new THREE.SphereGeometry(0.045, 16, 10), M.bulb, false);
  bulb.position.y = -drop - 0.06;
  g.add(bulb);
  if (light) {
    const l = new THREE.PointLight(0xffc98a, 0, 6, 2);
    l.position.y = -drop - 0.12;
    l.userData.night = intensity;
    g.add(l);
    lights.push(l);
  }
  return g;
}

function spot(M) {
  // recessed ceiling spot, faces down from y = 0
  const g = new THREE.Group();
  const ring = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 20), M.white, false);
  ring.position.y = -0.003;
  const lens = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.007, 16), M.bulb, false);
  lens.position.y = -0.004;
  g.add(ring, lens);
  return g;
}

function wardrobe(M, w, h, d, doors, mat = M.cabinetWhite) {
  // front at +z
  const g = new THREE.Group();
  g.add(bx(-w / 2, 0, -d / 2, w / 2, h, d / 2 - 0.02, mat));
  const dw = w / doors;
  for (let i = 0; i < doors; i++) {
    const x0 = -w / 2 + i * dw + 0.002, x1 = -w / 2 + (i + 1) * dw - 0.002;
    g.add(bx(x0, 0.06, d / 2 - 0.02, x1, h - 0.005, d / 2, mat));
    const hx = i % 2 ? x0 + 0.04 : x1 - 0.04;
    g.add(bx(hx - 0.008, h / 2 - 0.25, d / 2, hx + 0.008, h / 2 + 0.25, d / 2 + 0.02, M.blackMetal));
  }
  g.add(bx(-w / 2, 0, d / 2 - 0.05, w / 2, 0.06, d / 2 - 0.02, M.blackMetal));
  return g;
}

function tvUnit(M, w, lights, screenTex) {
  // console + wall TV, front at +z, back against the wall at z = -0.21
  const g = new THREE.Group();
  g.add(bx(-w / 2, 0.12, -0.21, w / 2, 0.5, 0.21, M.veneer, 0.01));
  for (let i = 0; i < 4; i++) {
    const x0 = -w / 2 + (i * w) / 4 + 0.004;
    g.add(bx(x0, 0.14, 0.205, x0 + w / 4 - 0.008, 0.48, 0.215, M.veneerDark));
  }
  for (const sx of [-1, 1]) g.add(bx(sx * (w / 2 - 0.1) - 0.015, 0, -0.15, sx * (w / 2 - 0.1) + 0.015, 0.12, 0.15, M.blackMetal));
  // TV 65"
  g.add(bx(-0.73, 0.95, -0.2, 0.73, 1.78, -0.165, M.screen));
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex, emissiveMap: screenTex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.25,
  });
  const scr = mesh(new THREE.PlaneGeometry(1.42, 0.8), screenMat, false);
  scr.position.set(0, 1.365, -0.164);
  g.add(scr);
  g.userData.screen = screenMat;
  // soundbar + decor
  g.add(bx(-0.45, 0.5, -0.15, 0.45, 0.57, -0.05, M.screen, 0.02));
  g.add(cyl(0.06, 0.05, 0.22, w / 2 - 0.25, 0.61, 0.0, M.ceramic, 20));
  g.add(bx(-w / 2 + 0.15, 0.5, -0.1, -w / 2 + 0.45, 0.56, 0.12, M.fabricTerra, 0.01));
  return g;
}

function rug(M, w, d, mat) {
  const m = bx(-w / 2, 0.003, -d / 2, w / 2, 0.015, d / 2, mat, 0.004);
  m.castShadow = false;
  return m;
}

function painting(M, w, h, seed, palette) {
  // hangs on a wall, front facing +z, centre at origin
  const g = new THREE.Group();
  g.add(bx(-w / 2, -h / 2, -0.03, w / 2, h / 2, 0, M.blackMetal));
  const mat = new THREE.MeshStandardMaterial({ map: paintingTexture(seed, palette), roughness: 0.85 });
  const p = mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), mat, false);
  p.position.z = 0.002;
  g.add(p);
  return g;
}

function plant(M, kind = 'fig', scale = 1) {
  const g = new THREE.Group();
  const potH = 0.42 * scale;
  g.add(cyl(0.2 * scale, 0.15 * scale, potH, 0, potH / 2, 0, kind === 'olive' ? M.potGrey : M.pot, 24));
  g.add(cyl(0.185 * scale, 0.185 * scale, 0.02, 0, potH - 0.03, 0, M.soil, 20));
  if (kind === 'snake') {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const blade = mesh(new THREE.ConeGeometry(0.035 * scale, (0.6 + (i % 3) * 0.18) * scale, 4), leafMat(M, 0x3f6b3a));
      blade.position.set(Math.cos(a) * 0.07 * scale, potH + 0.3 * scale, Math.sin(a) * 0.07 * scale);
      blade.rotation.set(Math.sin(a) * 0.15, a, Math.cos(a) * 0.15);
      blade.scale.z = 0.3;
      g.add(blade);
    }
    return g;
  }
  const trunkH = (kind === 'fig' ? 1.1 : 0.7) * scale;
  g.add(cyl(0.02 * scale, 0.03 * scale, trunkH, 0, potH + trunkH / 2, 0, M.bark, 8));
  const tone = kind === 'olive' ? 0x8f9a74 : kind === 'lemon' ? 0x4f7a3c : 0x3d6b33;
  const rnd = seeded(kind.length * 31 + Math.round(scale * 10));
  const top = potH + trunkH;
  const size = kind === 'fig' ? [0.13, 0.24] : kind === 'olive' ? [0.035, 0.1] : [0.06, 0.12];
  g.add(leafCanopy(M, {
    count: kind === 'fig' ? 70 : kind === 'olive' ? 420 : 260,
    radius: [0.3 * scale, 0.36 * scale, 0.3 * scale],
    center: [0, top + 0.05 * scale, 0],
    leaf: [size[0] * scale, size[1] * scale],
    color: tone,
    rnd,
  }));
  if (kind === 'lemon') {
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0xf2d13a, roughness: 0.5 });
    for (let i = 0; i < 9; i++) {
      const f = mesh(new THREE.SphereGeometry(0.035 * scale, 10, 8), fruitMat);
      const a = rnd() * Math.PI * 2;
      f.position.set(Math.cos(a) * 0.22 * scale, potH + trunkH + (rnd() - 0.4) * 0.3 * scale, Math.sin(a) * 0.22 * scale);
      g.add(f);
    }
  }
  return g;
}

// Leaf-shaped card used for canopies (pointed ellipse, slightly cupped).
let leafGeo = null;
function getLeafGeo() {
  if (leafGeo) return leafGeo;
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.5);
  sh.quadraticCurveTo(0.55, -0.15, 0.0, 0.5);
  sh.quadraticCurveTo(-0.55, -0.15, 0, -0.5);
  leafGeo = new THREE.ShapeGeometry(sh, 6);
  const pos = leafGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, x * x * 0.6);
  }
  leafGeo.computeVertexNormals();
  return leafGeo;
}
let leafCardMat = null;

// Canopy of individual leaves (one instanced mesh) inside an ellipsoid.
export function leafCanopy(M, { count, radius, center, leaf, color, rnd = Math.random }) {
  if (!leafCardMat) leafCardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(getLeafGeo(), leafCardMat, count);
  im.castShadow = true;
  im.receiveShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const base = new THREE.Color(color);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2;
    const rr = Math.pow(rnd(), 0.35);
    const sq = Math.sqrt(1 - u * u);
    p.set(center[0] + sq * Math.cos(th) * radius[0] * rr, center[1] + u * radius[1] * rr, center[2] + sq * Math.sin(th) * radius[2] * rr);
    e.set(rnd() * Math.PI * 2, th + Math.PI / 2, (rnd() - 0.5) * 1.2);
    q.setFromEuler(e);
    const k = 0.75 + rnd() * 0.5;
    sc.set(leaf[0] * k, leaf[1] * k, leaf[1] * k);
    m.compose(p, q, sc);
    im.setMatrixAt(i, m);
    c.copy(base).offsetHSL((rnd() - 0.5) * 0.04, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.12 + u * 0.04);
    im.setColorAt(i, c);
  }
  im.computeBoundingSphere();
  return im;
}

const leafMats = new Map();
function leafMat(M, color) {
  if (!leafMats.has(color)) leafMats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
  return leafMats.get(color);
}

export function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// Noisy icosphere with per-vertex colour variation – foliage clump.
export function foliageBlob(M, r, color, rnd = Math.random, detail = 2) {
  const geo = new THREE.IcosahedronGeometry(r, detail);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const base = new THREE.Color(color);
  const tmp = new THREE.Color();
  const seed = rnd() * 100;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = Math.sin(x * 17 + seed) * Math.cos(y * 13 + seed) * Math.sin(z * 19 + seed * 0.5);
    const k = 1 + n * 0.22 + (rnd() - 0.5) * 0.12;
    pos.setXYZ(i, x * k, y * k, z * k);
    tmp.copy(base).offsetHSL((rnd() - 0.5) * 0.03, 0, (rnd() - 0.5) * 0.12 + (y / r) * 0.06);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return mesh(geo, M.leaf);
}

// ---------------------------------------------------------------------------
// Kitchen
// ---------------------------------------------------------------------------
function kitchen(M, lights) {
  const g = new THREE.Group();
  const H = 0.9, top = 0.035, toe = 0.1;
  const run = (x0, z0, x1, z1, frontAxis, frontSign, mat = M.cabinetOlive) => {
    // carcass + doors + countertop; front faces ±x or ±z
    g.add(bx(x0, 0, z0, x1, toe, z1, M.blackMetal));
    const inset = 0.03;
    const cx0 = frontAxis === 'x' && frontSign < 0 ? x0 + inset : x0;
    const cx1 = frontAxis === 'x' && frontSign > 0 ? x1 - inset : x1;
    const cz0 = frontAxis === 'z' && frontSign < 0 ? z0 + inset : z0;
    const cz1 = frontAxis === 'z' && frontSign > 0 ? z1 - inset : z1;
    g.add(bx(cx0, toe, cz0, cx1, H - top, cz1, mat));
    // door fronts with gaps
    const len = frontAxis === 'x' ? z1 - z0 : x1 - x0;
    const n = Math.max(1, Math.round(len / 0.6));
    const dl = len / n;
    for (let i = 0; i < n; i++) {
      const a = (frontAxis === 'x' ? z0 : x0) + i * dl + 0.002;
      const b = a + dl - 0.004;
      const f = frontAxis === 'x' ? (frontSign > 0 ? x1 : x0) : (frontSign > 0 ? z1 : z0);
      const f0 = f - frontSign * 0.03, f1 = f - frontSign * 0.005;
      const lo = Math.min(f0, f1), hi = Math.max(f0, f1);
      const face = frontSign > 0 ? hi : lo;
      const h0 = Math.min(face, face + frontSign * 0.012), h1 = Math.max(face, face + frontSign * 0.012);
      if (frontAxis === 'x') {
        g.add(bx(lo, toe + 0.005, a, hi, H - top - 0.005, b, mat));
        g.add(bx(h0, H - top - 0.06, a + 0.05, h1, H - top - 0.045, b - 0.05, M.blackMetal));
      } else {
        g.add(bx(a, toe + 0.005, lo, b, H - top - 0.005, hi, mat));
        g.add(bx(a + 0.05, H - top - 0.06, h0, b - 0.05, H - top - 0.045, h1, M.blackMetal));
      }
    }
  };
  // west run (cooktop), front faces +x
  run(0.177, 5.68, 0.787, 8.281, 'x', 1);
  g.add(bx(0.177, 0.9 - 0.035, 5.68, 0.8, 0.9, 8.281, M.quartz));
  // south run (sink), front faces -z
  run(0.787, 7.67, 3.72, 8.281, 'z', -1);
  g.add(bx(0.8, 0.865, 7.655, 3.72, 0.9, 8.281, M.quartz));
  // peninsula with breakfast bar overhang toward the living room
  run(0.787, 5.98, 2.99, 6.49, 'z', 1);
  g.add(bx(0.8, 0.865, 5.66, 3.02, 0.9, 6.5, M.quartz));
  g.add(bx(2.99, 0, 5.66, 3.02, 0.865, 6.5, M.quartz)); // waterfall end
  // cooktop + hood
  g.add(bx(0.27, 0.9, 6.78, 0.75, 0.906, 7.52, M.screen));
  for (const [x, z] of [[0.4, 6.92], [0.62, 6.92], [0.4, 7.36], [0.62, 7.36]]) {
    g.add(cyl(0.06, 0.06, 0.02, x, 0.916, z, M.blackMetal, 16));
  }
  g.add(bx(0.177, 1.62, 6.7, 0.6, 1.72, 7.6, M.steelGrey));
  g.add(bx(0.177, 1.72, 7.0, 0.42, 2.85, 7.3, M.steelGrey));
  // sink + faucet
  g.add(bx(1.88, 0.9, 7.78, 2.48, 0.903, 8.18, M.blackMetal));
  g.add(cyl(0.015, 0.018, 0.32, 2.18, 1.06, 8.2, M.blackMetal, 10));
  const spout = cyl(0.012, 0.012, 0.18, 2.18, 1.21, 8.12, M.blackMetal, 10);
  spout.rotation.x = Math.PI / 2;
  g.add(spout);
  // fridge (built-in, steel) at the end of the south run
  g.add(bx(3.72, 0, 7.67, 4.32, 2.1, 8.281, M.steelGrey, 0.01));
  g.add(bx(3.72, 2.1, 7.67, 4.32, 2.4, 8.281, M.cabinetWhite));
  g.add(bx(3.74, 1.0, 7.65, 3.76, 1.7, 7.67, M.blackMetal));
  // upper cabinets + open shelf over the south run
  g.add(bx(1.2, 1.5, 7.93, 3.72, 2.25, 8.281, M.cabinetWhite));
  for (let x = 1.2; x < 3.71; x += 0.628) g.add(bx(x + 0.002, 1.5, 7.925, x + 0.626, 2.25, 7.93, M.cabinetWhite));
  g.add(bx(1.2, 1.46, 7.95, 3.72, 1.5, 8.281, M.veneer));
  // tile backsplash
  g.add(bx(1.121, 0.9, 8.27, 3.72, 1.46, 8.281, M.bathWall));
  g.add(bx(0.177, 0.9, 5.68, 0.188, 1.62, 8.281, M.bathWall));
  // tall pantry + oven tower facing the kitchen (front at x = 4.32)
  g.add(bx(4.34, 0, 5.98, 5.094, 2.4, 8.281, M.cabinetWhite));
  for (const [z0, z1] of [[5.98, 6.76], [6.76, 7.54]]) {
    g.add(bx(4.32, 0.05, z0 + 0.002, 4.34, 2.395, z1 - 0.002, M.cabinetWhite));
    g.add(bx(4.312, 0.9, z1 - 0.06, 4.322, 1.5, z1 - 0.045, M.blackMetal));
  }
  g.add(bx(4.32, 0.82, 7.62, 4.345, 1.42, 8.22, M.screen));
  g.add(bx(4.32, 1.48, 7.62, 4.345, 1.86, 8.22, M.screen));
  g.add(bx(4.31, 1.38, 7.7, 4.32, 1.395, 8.14, M.steelGrey));
  // decor on the counter
  g.add(cyl(0.11, 0.09, 0.08, 1.4, 0.94, 6.1, M.ceramic, 24));
  for (let i = 0; i < 5; i++) {
    const f = mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xe8a33c : 0xd9532f, roughness: 0.5 }));
    f.position.set(1.37 + (i % 3) * 0.04, 0.99 + Math.floor(i / 3) * 0.03, 6.08 + (i % 2) * 0.05);
    g.add(f);
  }
  const herbs = plant(M, 'lemon', 0.35);
  herbs.position.set(0.45, 0.9, 8.1);
  g.add(herbs);
  // bar stools
  for (const x of [1.25, 1.75, 2.27, 2.77]) {
    const s = stool(M);
    s.position.set(x, 0, 5.38);
    g.add(s);
  }
  // pendants over the peninsula
  for (const x of [1.35, 1.9, 2.45]) {
    const p = pendant(M, lights, 1.0, { r: 0.13, mat: M.brass, intensity: 3 });
    p.position.set(x, LEVELS.groundCeiling, 6.08);
    g.add(p);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Bathrooms
// ---------------------------------------------------------------------------
function toilet(M) {
  // wall-hung, back at local z = 0, bowl toward +z
  const g = new THREE.Group();
  const bowl = mesh(new THREE.SphereGeometry(0.2, 28, 18), M.ceramic);
  bowl.scale.set(0.9, 0.8, 1.35);
  bowl.position.set(0, 0.32, 0.27);
  g.add(bowl);
  g.add(bx(-0.17, 0.3, 0.02, 0.17, 0.42, 0.3, M.ceramic, 0.06));
  const seat = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.025, 28), M.ceramic);
  seat.scale.set(1, 1, 1.3);
  seat.position.set(0, 0.425, 0.27);
  g.add(seat);
  return g;
}

function vanity(M, w, { mirror = true } = {}) {
  // back at local z = 0, front toward +z
  const g = new THREE.Group();
  g.add(bx(-w / 2, 0.45, 0, w / 2, 0.82, 0.46, M.veneer, 0.01));
  g.add(bx(-w / 2, 0.82, 0, w / 2, 0.85, 0.48, M.quartz));
  const basin = mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.12, 32), M.ceramic);
  basin.position.set(0, 0.91, 0.25);
  g.add(basin);
  g.add(cyl(0.012, 0.014, 0.25, 0, 0.97, 0.06, M.blackMetal, 10));
  const sp = cyl(0.01, 0.01, 0.12, 0, 1.08, 0.11, M.blackMetal, 10);
  sp.rotation.x = Math.PI / 2;
  g.add(sp);
  if (mirror) {
    const m = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 48), M.chrome);
    m.rotation.x = Math.PI / 2;
    m.position.set(0, 1.55, 0.015);
    g.add(m);
    const rim = mesh(new THREE.TorusGeometry(0.345, 0.012, 8, 48), M.brass);
    rim.position.set(0, 1.55, 0.025);
    g.add(rim);
  }
  return g;
}

function shower(M, x0, z0, x1, z1, glassX, glassZ0, glassZ1, headPos, level) {
  const g = new THREE.Group();
  g.add(bx(x0 + 0.02, level + 0.004, z0 + 0.02, x1 - 0.02, level + 0.008, z1 - 0.02, M.bathTile));
  // glass panel
  const gl = bx(glassX - 0.005, level + 0.01, glassZ0, glassX + 0.005, level + 2.0, glassZ1, M.showerGlass);
  gl.castShadow = false;
  g.add(gl);
  g.add(bx(glassX - 0.012, level + 2.0, glassZ0, glassX + 0.012, level + 2.02, glassZ1, M.blackMetal));
  // rain head + mixer
  const [hx, hz] = headPos;
  g.add(cyl(0.12, 0.12, 0.01, hx, level + 2.15, hz, M.blackMetal, 32));
  g.add(cyl(0.01, 0.01, 0.35, hx, level + 2.3, hz, M.blackMetal, 8));
  g.add(cyl(0.025, 0.025, 0.06, hx, level + 1.1, hz, M.blackMetal, 12));
  // drain
  g.add(bx((x0 + x1) / 2 - 0.3, level + 0.009, z1 - 0.12, (x0 + x1) / 2 + 0.3, level + 0.011, z1 - 0.08, M.steelGrey));
  return g;
}

function washer(M, door = true) {
  const g = new THREE.Group();
  g.add(bx(-0.3, 0, -0.3, 0.3, 0.85, 0.3, M.white, 0.02));
  if (door) {
    const ring = mesh(new THREE.TorusGeometry(0.17, 0.03, 10, 32), M.steelGrey);
    ring.position.set(0, 0.42, 0.305);
    g.add(ring);
    const glass = mesh(new THREE.CircleGeometry(0.15, 32), M.screen);
    glass.position.set(0, 0.42, 0.302);
    g.add(glass);
  }
  g.add(bx(-0.28, 0.74, 0.3, 0.1, 0.82, 0.305, M.steelGrey));
  return g;
}

// ---------------------------------------------------------------------------
// Public: furnish every room. Returns light list (for night mode) and TV.
// ---------------------------------------------------------------------------
export function furnish(M, groups) {
  const lights = [];
  const G = new THREE.Group();
  const U = new THREE.Group();
  // Wrap so pieces built in absolute or local coordinates both place correctly.
  const add = (parent, obj, x, y, z, rot = 0) => {
    const holder = new THREE.Group();
    holder.add(obj);
    holder.position.set(x, y, z);
    holder.rotation.y = rot;
    parent.add(holder);
    return obj;
  };
  const up = LEVELS.upper;

  // ======================= GROUND FLOOR =======================
  // Living room
  add(G, rug(M, 3.1, 2.7, M.rugLiving), 2.35, 0, 2.6);
  add(G, sofa(M, 2.9, 0.95, {
    chaise: 0.85, chaiseSide: -1,
    cushions: [{ x: -0.9, mat: M.fabricTerra }, { x: -0.3, mat: M.fabricMustard }, { x: 0.6, mat: M.fabricGreen }],
  }), 3.6, 0, 2.5, FACE.west);
  add(G, table(M, 1.3, 0.85, 0.38, { top: M.veneer, legs: M.veneerDark }), 2.0, 0, 2.95, Math.PI / 2);
  add(G, cyl(0.09, 0.07, 0.14, 0, 0, 0, M.ceramic), 1.95, 0.45, 2.7);
  add(G, bx(-0.18, 0, -0.13, 0.18, 0.06, 0.13, M.fabricNavy), 2.05, 0.38, 3.25);
  const screenTex = welcomeScreenTexture(['ברוכים הבאים הביתה', 'שרית ויונה ♥']);
  const tv = add(G, tvUnit(M, 2.2, lights, screenTex), 0.39, 0, 2.5, FACE.east);
  // window bench with cushions under the north window
  add(G, bx(0.2, 0, 0.202, 4.42, 0.4, 0.62, M.veneer, 0.01), 0, 0, 0);
  for (let i = 0; i < 5; i++) {
    const x = 0.65 + i * 0.85;
    add(G, cb(0.8, 0.1, 0.4, 0, 0, 0, M.fabricSofa, 0.04), x, 0.45, 0.42);
    const back = cb(0.5, 0.4, 0.14, 0, 0, 0, [M.fabricTerra, M.fabricGreen, M.fabricMustard, M.fabricBlush, M.fabricNavy][i], 0.06);
    back.rotation.x = 0.2;
    add(G, back, x, 0.68, 0.3);
  }
  add(G, floorLamp(M, lights), 4.55, 0, 0.9);
  add(G, plant(M, 'fig', 1.1), 5.1, 0, 0.62);
  add(G, plant(M, 'snake', 0.9), 0.55, 0, 4.15);
  add(G, armchair(M, M.fabricGreen), 1.15, 0, 4.0, FACE.north + 0.5);
  // chandelier over the seating
  add(G, pendant(M, lights, 0.75, { r: 0.32, mat: M.lampShade, intensity: 8 }), 2.4, LEVELS.groundCeiling, 2.6);

  // Kitchen
  G.add(kitchen(M, lights));

  // Entrance
  add(G, bx(5.55, 0.78, 4.506, 6.05, 0.82, 4.86, M.veneer), 0, 0, 0);
  add(G, bx(5.58, 0, 4.52, 5.6, 0.78, 4.84, M.blackMetal), 0, 0, 0);
  add(G, bx(6.0, 0, 4.52, 6.02, 0.78, 4.84, M.blackMetal), 0, 0, 0);
  const mir = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.015, 40), M.chrome);
  mir.rotation.x = Math.PI / 2;
  add(G, mir, 5.8, 1.45, 4.515);
  add(G, cyl(0.07, 0.05, 0.28, 0, 0, 0, M.pot), 5.9, 0.96, 4.68);
  add(G, bx(5.75, 0.003, 4.85, 6.1, 0.012, 5.8, M.fabricNavy), 0, 0, 0);
  for (const [x, z] of [[4.8, 5.0], [5.6, 5.0], [4.8, 5.6], [5.6, 5.6]]) add(G, spot(M), x, 2.5, z);
  // gallery wall in the hall
  add(G, painting(M, 0.9, 0.65, 3, ['#efe6d6', '#c4734a', '#7c8560', '#d9b26a', '#33415c']), 5.172, 1.55, 6.9, FACE.east);
  add(G, painting(M, 0.6, 0.8, 9, ['#e9e4dc', '#3c4a63', '#a9c4c2', '#c0714f']), 5.172, 1.5, 7.75, FACE.east);

  // Guest WC
  add(G, toilet(M), 8.18, 0, 7.85, FACE.west);
  add(G, bx(8.18, 0, 7.5, 8.371, 1.1, 8.2, M.bathWall), 0, 0, 0);
  add(G, vanity(M, 0.5), 7.45, -0.1, 7.284, FACE.south);

  // Utility closet: boiler + water heater
  add(G, bx(9.45, 1.0, 7.9, 9.9, 1.75, 8.25, M.white, 0.02), 0, 0, 0);
  add(G, cyl(0.25, 0.25, 1.2, 0, 0, 0, M.white), 8.9, 0.6, 7.95);

  // Master bedroom
  add(G, rug(M, 2.5, 2.4, M.rugMaster), 3.49, 0, 10.4);
  add(G, bed(M, 1.8, 2.0, { throwMat: M.fabricBlush, head: M.fabricSofa, headH: 0.95 }), 3.49, 0, 10.8, FACE.north);
  add(G, nightstand(M, lights), 2.3, 0, 11.55, FACE.north);
  add(G, nightstand(M, lights), 4.65, 0, 11.55, FACE.north);
  add(G, wardrobe(M, 2.5, 2.5, 0.6, 4), 1.677, 0, 10.55, FACE.east);
  add(G, wardrobe(M, 1.3, 0.8, 0.45, 3, M.veneer), 2.3, 0, 8.71, FACE.south);
  add(G, painting(M, 1.0, 0.7, 21, ['#f3ece2', '#d9a89a', '#7c8560', '#c9a46a', '#3c4a63']), 2.3, 1.55, 8.486, FACE.south);
  add(G, bx(2.75, 0.0, 9.35, 4.25, 0.45, 9.75, M.fabricGreen, 0.04), 0, 0, 0);
  add(G, plant(M, 'snake', 0.8), 4.55, 0, 8.75);
  add(G, pendant(M, lights, 0.5, { r: 0.28, mat: M.lampShade, intensity: 5 }), 3.49, LEVELS.groundCeiling, 10.3);

  // Corridor: linen cabinet + art
  add(G, wardrobe(M, 1.04, 2.2, 0.27, 2), 6.95, 0, 9.565, FACE.north);
  add(G, painting(M, 0.8, 0.55, 33, ['#efe6d6', '#33415c', '#c4734a', '#e8c37d']), 6.0, 1.55, 8.486, FACE.south);
  for (const x of [5.4, 6.4]) add(G, spot(M), x, LEVELS.groundCeiling, 9.1);

  // Master bathroom
  add(G, vanity(M, 0.8), 4.971, 0, 10.65, FACE.east);
  add(G, bx(5.85, 0, 11.6, 6.35, 1.2, 11.8, M.bathWall), 0, 0, 0);
  add(G, bx(5.83, 1.2, 11.58, 6.37, 1.23, 11.8, M.quartz), 0, 0, 0);
  add(G, toilet(M), 6.1, 0, 11.6, FACE.north);
  G.add(shower(M, 6.6, 9.855, 7.471, 11.8, 6.6, 10.55, 11.8, [7.05, 11.2], 0));
  add(G, bx(5.0, 1.15, 10.0, 5.03, 1.17, 10.2, M.chrome), 0, 0, 0);
  for (const z of [10.3, 11.2]) add(G, spot(M), 5.8, LEVELS.groundCeiling, z);

  // Safe room (ממ"ד) – study / guest room
  add(G, rug(M, 2.0, 1.6, M.rugPlay), 8.9, 0, 10.7);
  add(G, bed(M, 1.4, 2.0, { throwMat: M.fabricNavy, head: M.fabricGreen, headH: 0.9 }), 8.7, 0, 10.75, FACE.east);
  add(G, nightstand(M, lights), 7.95, 0, 9.65, FACE.east);
  add(G, table(M, 1.2, 0.6, 0.75, { top: M.veneer }), 10.0, 0, 8.8);
  add(G, chair(M, M.fabricTerra), 10.0, 0, 9.3, FACE.north);
  add(G, bx(9.6, 0.75, 8.6, 10.1, 1.05, 8.62, M.screen), 0, 0, 0);
  add(G, wardrobe(M, 2.1, 2.3, 0.6, 3), 10.474, 0, 10.55, FACE.west);
  add(G, painting(M, 0.7, 0.5, 44, ['#e9e4dc', '#7c8560', '#d9b26a', '#33415c']), 8.4, 1.6, 8.486, FACE.south);
  add(G, pendant(M, lights, 0.45, { r: 0.22, mat: M.lampShade, intensity: 4 }), 9.2, LEVELS.groundCeiling, 10.1);

  // ======================= UPPER FLOOR =======================
  // Laundry corner
  add(U, washer(M), 5.0, up, 6.6);
  add(U, washer(M), 5.62, up, 6.6);
  add(U, bx(4.675, up + 0.85, 6.282, 6.871, up + 0.89, 6.92, M.quartz), 0, 0, 0);
  add(U, bx(5.95, up, 6.282, 6.871, up + 0.85, 6.9, M.cabinetWhite), 0, 0, 0);
  add(U, bx(4.675, up + 1.5, 6.282, 6.871, up + 2.2, 6.62, M.cabinetWhite), 0, 0, 0);
  for (let x = 4.675; x < 6.86; x += 0.549) add(U, bx(x + 0.002, up + 1.5, 6.615, x + 0.547, up + 2.2, 6.625, M.cabinetWhite), 0, 0, 0);
  add(U, cyl(0.17, 0.14, 0.25, 0, 0, 0, M.fabricNavy), 6.4, up + 1.015, 6.6);
  // reading corner in the hall
  add(U, armchair(M, M.fabricMustard), 5.2, up, 7.8, FACE.east + 0.3);
  add(U, floorLamp(M, lights), 4.85, up, 8.25);
  add(U, plant(M, 'fig', 0.85), 4.9, up, 7.2);
  add(U, rug(M, 1.4, 1.0, M.rugLiving), 5.6, up, 7.85);
  for (const [x, z] of [[5.8, 7.4], [5.8, 9.0], [6.9, 9.0]]) add(U, spot(M), x, LEVELS.upperCeiling, z);
  add(U, wardrobe(M, 0.85, 2.2, 0.26, 2), 6.9, up, 9.79, FACE.north);

  // Playroom
  add(U, rug(M, 2.2, 1.8, M.rugPlay), 3.0, up, 9.9);
  for (let i = 0; i < 4; i++) {
    const z = 8.75 + i * 0.68;
    add(U, bx(1.377, up, z - 0.33, 1.77, up + 1.0, z + 0.33, M.cabinetWhite), 0, 0, 0);
    for (let k = 0; k < 2; k++) {
      add(U, bx(1.6, up + 0.08 + k * 0.48, z - 0.27, 1.79, up + 0.4 + k * 0.48, z + 0.27, M.toy[(i + k) % 5], 0.02), 0, 0, 0);
    }
  }
  // teepee
  const tp = new THREE.Group();
  const cone = mesh(new THREE.ConeGeometry(0.62, 1.55, 6, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1e7d2, roughness: 0.95, side: THREE.DoubleSide }));
  cone.position.y = 0.775;
  tp.add(cone);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pole = cyl(0.012, 0.012, 1.95, Math.cos(a) * 0.3, 0.95, Math.sin(a) * 0.3, M.veneer, 6);
    pole.rotation.z = Math.cos(a) * 0.36;
    pole.rotation.x = -Math.sin(a) * 0.36;
    tp.add(pole);
  }
  add(U, tp, 2.45, up, 9.15);
  add(U, cb(0.55, 0.12, 0.55, 0, 0, 0, M.fabricBlush, 0.05), 2.45, up + 0.06, 9.15);
  // kids table
  add(U, table(M, 0.7, 0.7, 0.5, { top: M.cabinetWhite, legs: M.veneer, round: true }), 3.7, up, 9.3);
  for (const [dx, dz, c] of [[-0.42, 0, 0], [0.42, 0, 2], [0, 0.42, 4]]) {
    const ch = new THREE.Group();
    ch.add(bx(-0.15, 0.27, -0.15, 0.15, 0.3, 0.15, M.toy[c]));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) ch.add(cyl(0.012, 0.012, 0.27, sx * 0.12, 0.135, sz * 0.12, M.veneer, 6));
    ch.add(bx(-0.14, 0.3, 0.12, 0.14, 0.52, 0.15, M.toy[c]));
    add(U, ch, 3.7 + dx, up, 9.3 + dz, Math.atan2(dx, dz) + Math.PI);
  }
  // sofa bed under the window + bean bags
  add(U, sofa(M, 1.9, 0.85, { mat: M.fabricNavy, cushions: [{ x: -0.4, mat: M.fabricMustard }, { x: 0.4, mat: M.fabricBlush }] }), 2.9, up, 11.05, FACE.north);
  for (const [x, z, m] of [[4.05, 10.6, M.fabricTerra], [4.1, 11.1, M.fabricGreen]]) {
    const bb = mesh(new THREE.SphereGeometry(0.32, 24, 16), m);
    bb.scale.set(1, 0.65, 1);
    add(U, bb, x, up + 0.2, z);
  }
  // toy blocks on the rug
  for (let i = 0; i < 6; i++) add(U, cb(0.08, 0.08, 0.08, 0, 0, 0, M.toy[i % 5]), 3.0 + (i % 3) * 0.1, up + 0.055 + Math.floor(i / 3) * 0.08, 10.2 + (i % 2) * 0.05);
  add(U, painting(M, 0.9, 0.6, 55, ['#f6efe0', '#5fa8d3', '#f2c14e', '#e0624a', '#7bc47f']), 3.0, up + 1.55, 8.486, FACE.south);
  add(U, pendant(M, lights, 0.5, { r: 0.3, mat: M.lampShade, intensity: 5 }), 3.0, LEVELS.upperCeiling, 10.0);

  // Upper bathroom
  add(U, vanity(M, 0.75), 4.675, up, 10.78, FACE.east);
  add(U, bx(5.8, up, 11.6, 6.3, up + 1.2, 11.799, M.bathWall), 0, 0, 0);
  add(U, bx(5.78, up + 1.2, 11.58, 6.32, up + 1.23, 11.799, M.quartz), 0, 0, 0);
  add(U, toilet(M), 6.05, up, 11.6, FACE.north);
  U.add(shower(M, 6.5, 10.022, 7.471, 11.799, 6.5, 10.75, 11.799, [6.98, 11.2], up));
  for (const z of [10.4, 11.3]) add(U, spot(M), 5.6, LEVELS.upperCeiling, z);

  // Upper bedroom
  add(U, rug(M, 2.3, 2.3, M.rugMaster), 9.175, up, 10.5);
  add(U, bed(M, 1.6, 2.0, { throwMat: M.fabricGreen, head: M.fabricBlush, headH: 0.9 }), 9.175, up, 10.8, FACE.north);
  add(U, nightstand(M, lights), 8.1, up, 11.55, FACE.north);
  add(U, nightstand(M, lights), 10.25, up, 11.55, FACE.north);
  add(U, wardrobe(M, 1.77, 2.5, 0.6, 3), 9.986, up, 8.783, FACE.south);
  add(U, table(M, 1.2, 0.55, 0.75, { top: M.veneer }), 10.6, up, 10.25, Math.PI / 2);
  add(U, chair(M, M.fabricSofa), 10.1, up, 10.25, FACE.east);
  add(U, painting(M, 0.7, 0.9, 66, ['#efe6d6', '#c0714f', '#7c8560', '#d9b26a']), 7.58, up + 1.5, 10.4, FACE.east);
  add(U, plant(M, 'olive', 0.9), 7.95, up, 9.95);
  add(U, pendant(M, lights, 0.45, { r: 0.26, mat: M.lampShade, intensity: 5 }), 9.175, LEVELS.upperCeiling, 10.2);

  groups.ground.add(G);
  groups.upper.add(U);
  return { lights, tv: tv.userData.screen };
}

// ---------------------------------------------------------------------------
// Roof equipment: solar collectors, water heater, AC condensers
// ---------------------------------------------------------------------------
export function roofEquipment(M, groupRoof) {
  const g = new THREE.Group();
  const y = LEVELS.roof;
  for (const x of [7.35, 8.25]) {
    const p = new THREE.Group();
    p.add(bx(-0.42, 0, -1.0, 0.42, 0.06, 1.0, M.frame));
    p.add(bx(-0.4, 0.06, -0.98, 0.4, 0.065, 0.98, M.solar));
    p.position.set(x, y + 0.75, 7.6);
    p.rotation.x = 0.55;
    g.add(p);
    g.add(bx(x - 0.4, y, 6.75, x - 0.37, y + 1.25, 6.8, M.frame));
    g.add(bx(x + 0.37, y, 6.75, x + 0.4, y + 1.25, 6.8, M.frame));
  }
  const tank = cyl(0.3, 0.3, 1.25, 8.27, y + 0.625, 8.99, M.white, 32);
  g.add(tank);
  for (const [x, z] of [[6.85, 7.0], [6.85, 8.2], [9.45, 7.2]]) {
    g.add(bx(x - 0.15, y, z - 0.42, x + 0.15, y + 0.6, z + 0.42, M.white, 0.02));
    const fan = mesh(new THREE.CircleGeometry(0.22, 24), M.blackMetal);
    fan.position.set(x < 8 ? x + 0.152 : x - 0.152, y + 0.3, z);
    fan.rotation.y = x < 8 ? Math.PI / 2 : -Math.PI / 2;
    g.add(fan);
  }
  groupRoof.add(g);
}
