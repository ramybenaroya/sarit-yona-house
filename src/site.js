import * as THREE from 'three';
import { LEVELS, SITE } from './plan.js';
import { Batch } from './builder.js';
import { foliageBlob, leafCanopy, seeded } from './furniture.js';

const ALL = (m) => ({ px: m, nx: m, py: m, ny: m, pz: m, nz: m });

function mesh(geo, mat, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------
export function oliveTree(M, scale = 1, seed = 1, detailed = false) {
  const g = new THREE.Group();
  const rnd = seeded(seed * 97 + 13);
  // gnarled multi-stem trunk
  const stems = 3;
  for (let s = 0; s < stems; s++) {
    const a = (s / stems) * Math.PI * 2 + rnd();
    const pts = [];
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      pts.push(new THREE.Vector3(
        Math.cos(a) * (0.08 + t * 0.55) * scale + Math.sin(t * 5 + s) * 0.08 * scale,
        t * 1.9 * scale,
        Math.sin(a) * (0.08 + t * 0.55) * scale + Math.cos(t * 4 + s) * 0.08 * scale,
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = mesh(new THREE.TubeGeometry(curve, 16, 0.09 * scale * (1 - s * 0.15), 8), M.bark);
    g.add(tube);
  }
  // silvery canopy: soft inner clumps wrapped in thousands of narrow leaves
  const n = detailed ? 11 : 16;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const rr = (0.3 + rnd() * 1.0) * scale;
    const r = (0.45 + rnd() * 0.35) * scale;
    const cx = Math.cos(a) * rr, cy = (1.9 + rnd() * 1.1) * scale, cz = Math.sin(a) * rr;
    const b = foliageBlob(M, detailed ? r * 0.55 : r, detailed ? 0x5d6a4a : 0x8e9b74, rnd, 2);
    b.position.set(cx, cy, cz);
    b.scale.y = 0.7;
    g.add(b);
    if (detailed) {
      g.add(leafCanopy(M, {
        count: 520, radius: [r * 1.05, r * 0.8, r * 1.05], center: [cx, cy, cz],
        leaf: [0.04 * scale + 0.012, 0.13 * scale + 0.025], color: 0x9aa483, rnd,
      }));
    }
  }
  return g;
}

// Mediterranean cypress: a slim spire of dense foliage (lathe + leafy noise).
export function cypressTree(M, h = 7, seed = 1) {
  const g = new THREE.Group();
  const rnd = seeded(seed * 31 + 7);
  const trunk = mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.7, 8), M.bark);
  trunk.position.y = 0.35;
  g.add(trunk);
  const R = 0.55 * (h / 7) + rnd() * 0.08;
  const pts = [];
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = R * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.75);
    pts.push(new THREE.Vector2(Math.max(0.001, r), 0.35 + t * (h - 0.35)));
  }
  const geo = new THREE.LatheGeometry(pts, 28);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const base = new THREE.Color(0x2c4627);
  const tmp = new THREE.Color();
  const ph = rnd() * 10;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const tuft = Math.sin(a * 7 + y * 3.1 + ph) * Math.sin(y * 5.3 - a * 3 + ph) * 0.5 + 0.5;
    const k = 1 + (tuft - 0.5) * 0.28 + Math.sin(y * 1.3 + ph) * 0.04;
    pos.setXYZ(i, x * k, y, z * k);
    tmp.copy(base).offsetHSL((rnd() - 0.5) * 0.02, 0.02, (tuft - 0.5) * 0.09 + (y / h) * 0.04);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const crown = mesh(geo, M.cypress);
  crown.rotation.z = (rnd() - 0.5) * 0.04;
  g.add(crown);
  return g;
}

function pineTree(M, h, seed) {
  const g = new THREE.Group();
  const rnd = seeded(seed);
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.2, h * 0.6, 7), M.bark));
  g.children[0].position.y = h * 0.3;
  for (let i = 0; i < 4; i++) {
    const b = foliageBlob(M, h * (0.22 + rnd() * 0.08), 0x3d5a32, rnd, 1);
    b.position.set((rnd() - 0.5) * h * 0.25, h * (0.62 + rnd() * 0.25), (rnd() - 0.5) * h * 0.25);
    b.scale.y = 0.6;
    g.add(b);
  }
  return g;
}

function shrub(M, r, color, seed, flowers = null) {
  const g = new THREE.Group();
  const rnd = seeded(seed);
  const core = foliageBlob(M, r * 0.7, 0x4d6640, rnd, 1);
  core.scale.y = 0.7;
  core.position.y = r * 0.5;
  g.add(core);
  g.add(leafCanopy(M, { count: 160, radius: [r, r * 0.75, r], center: [0, r * 0.55, 0], leaf: [0.025, 0.09], color, rnd }));
  if (flowers) g.add(leafCanopy(M, { count: 70, radius: [r * 1.02, r * 0.85, r * 1.02], center: [0, r * 0.7, 0], leaf: [0.03, 0.06], color: flowers, rnd }));
  return g;
}

// ---------------------------------------------------------------------------
// Distant terrain: Judean-hills style rolling ground with dry grass colours
// ---------------------------------------------------------------------------
function terrain(M) {
  const R = 900;
  const geo = new THREE.CircleGeometry(R, 160, 0, Math.PI * 2);
  // densify: use a ring/polar layout via a custom geometry
  const radial = 70, segs = 160;
  const pos = [], col = [], idx = [];
  const c1 = new THREE.Color(0xb7ad7f), c2 = new THREE.Color(0x9c9563), c3 = new THREE.Color(0xcfc29a), c4 = new THREE.Color(0x7e8452);
  const tmp = new THREE.Color();
  const h = (x, z) => {
    const d = Math.hypot(x, z);
    const ramp = THREE.MathUtils.smoothstep(d, 30, 220);
    const n = Math.sin(x * 0.012) * Math.cos(z * 0.01) * 18
      + Math.sin(x * 0.031 + 1.3) * Math.sin(z * 0.027 + 0.4) * 8
      + Math.sin(x * 0.07) * Math.cos(z * 0.06) * 2.5;
    // terraces/valleys falling to the east (toward the desert)
    const fall = -Math.max(0, x) * 0.12;
    return LEVELS.lawn - 0.02 + ramp * (n + 6 + fall * ramp);
  };
  for (let i = 0; i <= radial; i++) {
    const t = i / radial;
    const r = 0.5 + Math.pow(t, 1.8) * (R - 0.5);
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const x = 6 + Math.cos(a) * r, z = 6 + Math.sin(a) * r;
      const y = h(x - 6, z - 6);
      pos.push(x, y, z);
      const k = (Math.sin(x * 0.05) * Math.cos(z * 0.045) + 1) / 2;
      tmp.copy(c1).lerp(c2, k);
      if (y > 14) tmp.lerp(c3, 0.4);
      if (((x * 13 + z * 7) | 0) % 9 === 0) tmp.lerp(c4, 0.35);
      col.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let i = 0; i < radial; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * segs + j, b = i * segs + ((j + 1) % segs);
      const c = (i + 1) * segs + j, d = (i + 1) * segs + ((j + 1) % segs);
      idx.push(a, b, c, b, d, c);
    }
  }
  geo.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, M.terrain);
  m.receiveShadow = true;
  return { mesh: m, height: h };
}

// ---------------------------------------------------------------------------
// Neighbourhood: simple stone houses with flat roofs + solar heaters
// ---------------------------------------------------------------------------
function neighbourhood(M, heightAt) {
  const g = new THREE.Group();
  const b = new Batch();
  const rnd = seeded(2024);
  const spots = [];
  // two rows of houses along the street to the east, and scattered beyond
  for (let i = 0; i < 22; i++) {
    let x, z;
    if (i < 8) { x = -34 - (i % 2) * 16; z = -36 + Math.floor(i / 2) * 22; }
    else if (i < 14) { x = 44 + (i % 2) * 16; z = -30 + Math.floor((i - 8) / 2) * 24; }
    else { const a = rnd() * Math.PI * 2, r = 85 + rnd() * 60; x = 6 + Math.cos(a) * r; z = 6 + Math.sin(a) * r; }
    spots.push([x, z]);
  }
  for (const spot of spots) {
    const [x, z] = spot;
    const w = 8 + rnd() * 4, d = 9 + rnd() * 4, h = rnd() > 0.4 ? 6.4 : 3.4;
    spot.push(w, d, h);
    const y0 = heightAt(x - 6, z - 6) - 0.3;
    b.box(x - w / 2, y0, z - d / 2, x + w / 2, y0 + h + 0.3, z + d / 2, { ...ALL(M.stone), py: M.roof });
    // windows as dark insets
    for (let k = 0; k < 3; k++) {
      const wx = x - w / 2 + 1.2 + k * (w - 2.4) / 2;
      b.box(wx - 0.6, y0 + 1.3, z + d / 2, wx + 0.6, y0 + 2.6, z + d / 2 + 0.02, ALL(M.frame));
      if (h > 4) b.box(wx - 0.5, y0 + 4.3, z + d / 2, wx + 0.5, y0 + 5.5, z + d / 2 + 0.02, ALL(M.frame));
    }
    b.box(x - 1, y0 + h + 0.3, z - 1, x + 0.4, y0 + h + 1.2, z + 0.6, ALL(M.white));
  }
  b.build(g);
  // a few red-tiled gable roofs for variety
  const tile = new THREE.MeshStandardMaterial({ color: 0xa9533b, roughness: 0.8 });
  spots.forEach(([x, z, w, d, h], i) => {
    if (i % 3 !== 1) return;
    const hh = 2.2;
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2 - 0.4, 0); sh.lineTo(w / 2 + 0.4, 0); sh.lineTo(0, hh); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false });
    geo.translate(0, 0, -(d + 0.6) / 2);
    const roof = mesh(geo, tile);
    const y0 = heightAt(x - 6, z - 6) - 0.3;
    roof.position.set(x, y0 + h + 0.3, z);
    g.add(roof);
  });
  for (const [x, z] of spots) {
    if (rnd() > 0.5) {
      const t = oliveTree(M, 0.9 + rnd() * 0.4, Math.floor(x * z));
      t.position.set(x + 6, heightAt(x, z - 3), z + 3);
      g.add(t);
    }
  }
  // pine groves on the hills (Ramat Rachel's forest edges)
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 70 + rnd() * 240;
    const x = 6 + Math.cos(a) * r, z = 6 + Math.sin(a) * r;
    const t = pineTree(M, 7 + rnd() * 6, i + 3);
    t.position.set(x, heightAt(x - 6, z - 6) - 0.2, z);
    g.add(t);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Pergola over the courtyard
// ---------------------------------------------------------------------------
function pergola(M, lights) {
  const P = SITE.pergola;
  const g = new THREE.Group();
  const b = new Batch();
  const yTop = P.top, beamH = 0.16;
  // perimeter beams
  b.box(P.x0, yTop - beamH, P.z0, P.x1, yTop, P.z0 + 0.1, ALL(M.frame));
  b.box(P.x1 - 0.1, yTop - beamH, P.z0, P.x1, yTop, P.z1, ALL(M.frame));
  b.box(P.x0, yTop - beamH, P.z0, P.x0 + 0.08, yTop, P.z1, ALL(M.frame));
  for (const z of P.beams) b.box(P.x0, yTop - beamH, z - 0.04, P.x1, yTop - 0.02, z + 0.04, ALL(M.frame));
  // posts
  for (const z of [P.z0 + 0.05, 3.0]) b.box(P.x1 - 0.1, LEVELS.courtyard, z - 0.05, P.x1, yTop - beamH, z + 0.05, ALL(M.frame));
  // wood-look aluminium slats running north–south
  const slatMat = M.veneer;
  for (let x = P.x0 + 0.12; x < P.x1 - 0.12; x += 0.13) {
    b.box(x, yTop - 0.02, P.z0 + 0.1, x + 0.05, yTop + 0.1, P.z1, ALL(slatMat));
  }
  b.build(g);
  // string lights along the beams
  const bulbGeo = new THREE.SphereGeometry(0.035, 10, 8);
  for (const z of P.beams) {
    for (let x = P.x0 + 0.25; x < P.x1 - 0.2; x += 0.35) {
      const sag = Math.sin(((x - P.x0) / (P.x1 - P.x0)) * Math.PI) * 0.18;
      const bulb = mesh(bulbGeo, M.bulb, false);
      bulb.position.set(x, yTop - beamH - 0.08 - sag, z);
      g.add(bulb);
    }
  }
  for (const z of [1.8, 4.3]) {
    const l = new THREE.PointLight(0xffc27a, 0, 7, 2);
    l.position.set((P.x0 + P.x1) / 2, yTop - 0.5, z);
    l.userData.night = 7;
    g.add(l);
    lights.push(l);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Outdoor furniture
// ---------------------------------------------------------------------------
function outdoorFurniture(M) {
  const g = new THREE.Group();
  const b = new Batch();
  const y = LEVELS.courtyard;
  const teak = M.veneerDark;
  // dining table 2.0 x 0.95
  const tx0 = 6.75, tx1 = 8.75, tz0 = 2.55, tz1 = 3.5;
  b.box(tx0, y + 0.72, tz0, tx1, y + 0.76, tz1, ALL(teak));
  for (const x of [tx0 + 0.1, tx1 - 0.16]) for (const z of [tz0 + 0.1, tz1 - 0.16]) b.box(x, y, z, x + 0.06, y + 0.72, z + 0.06, ALL(teak));
  // chairs (3 per side)
  for (let i = 0; i < 3; i++) {
    const cx = tx0 + 0.35 + i * 0.65;
    for (const side of [-1, 1]) {
      const cz = side < 0 ? tz0 - 0.32 : tz1 + 0.32;
      b.box(cx - 0.22, y + 0.42, cz - 0.21, cx + 0.22, y + 0.46, cz + 0.21, ALL(teak));
      const bz = side < 0 ? cz - 0.21 : cz + 0.17;
      b.box(cx - 0.22, y + 0.46, bz, cx + 0.22, y + 0.88, bz + 0.04, ALL(teak));
      for (const dx of [-0.19, 0.16]) for (const dz of [-0.18, 0.15]) b.box(cx + dx, y, cz + dz, cx + dx + 0.03, y + 0.42, cz + dz + 0.03, ALL(M.blackMetal));
    }
  }
  // lounge sofa along the north edge, facing south
  const sx0 = 6.95, sx1 = 8.95, sz0 = 0.25, sz1 = 1.05;
  b.box(sx0, y, sz0, sx1, y + 0.3, sz1, ALL(teak));
  b.box(sx0, y + 0.3, sz0, sx1, y + 0.75, sz0 + 0.18, ALL(M.fabricSofa));
  b.box(sx0 + 0.02, y + 0.3, sz0 + 0.18, sx1 - 0.02, y + 0.45, sz1, ALL(M.fabricSofa));
  b.box(5.95 + 1.6, y, 1.4, 6.75 + 1.6, y + 0.35, 1.9, ALL(teak));
  b.build(g);
  return g;
}

function sauna(M) {
  const S = SITE.sauna;
  const g = new THREE.Group();
  const b = new Batch();
  const y0 = LEVELS.outside;
  b.box(S.x0, y0, S.z0, S.x1, y0 + S.h, S.z1, { ...ALL(M.cedar), px: null });
  // east face with glass door
  b.box(S.x1 - 0.04, y0, S.z0, S.x1, y0 + S.h, S.z0 + 0.2, ALL(M.cedar));
  b.box(S.x1 - 0.04, y0, S.z1 - 0.2, S.x1, y0 + S.h, S.z1, ALL(M.cedar));
  b.box(S.x1 - 0.04, y0 + 1.75, S.z0, S.x1, y0 + S.h, S.z1, ALL(M.cedar));
  b.box(S.x1 - 0.03, y0, S.z0 + 0.2, S.x1 - 0.01, y0 + 1.75, S.z1 - 0.2, ALL(M.glass));
  b.box(S.x1 - 0.04, y0, S.z0 + 0.2, S.x1 + 0.005, y0 + 0.05, S.z1 - 0.2, ALL(M.cedar));
  // roof
  b.box(S.x0 - 0.06, y0 + S.h, S.z0 - 0.06, S.x1 + 0.06, y0 + S.h + 0.08, S.z1 + 0.06, ALL(M.frame));
  b.build(g);
  const chimney = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), M.blackMetal);
  chimney.position.set(S.x0 + 0.3, y0 + S.h + 0.3, S.z0 + 0.3);
  g.add(chimney);
  return g;
}

// ---------------------------------------------------------------------------
// Ground surfaces, boundary walls, planting
// ---------------------------------------------------------------------------
export function buildSite(M, groups, lights) {
  const site = groups.site;
  const L = SITE.lot;
  const { mesh: terr, height } = terrain(M);
  site.add(terr);

  const b = new Batch();
  // lawn over the whole lot
  b.box(L.x0 - 6, LEVELS.lawn - 0.3, L.z0 - 6, L.x1 + 6, LEVELS.lawn, L.z1 + 6, { py: M.grass });
  // courtyard paving under the pergola
  const C = SITE.courtyard;
  b.box(5.672, LEVELS.lawn, C.z0, C.x1, LEVELS.courtyard, C.z1, { py: M.paving, px: M.stone, nz: M.stone });
  // paved entry between the courtyard and the access path
  b.box(C.x1, LEVELS.lawn, 4.4, SITE.path.x0, LEVELS.courtyard - 0.01, 6.08, { py: M.paving, nz: M.stone, pz: M.stone });
  // access path along the east side
  const Pp = SITE.path;
  b.box(Pp.x0, LEVELS.lawn, Pp.z0, Pp.x1, LEVELS.courtyard - 0.02, Pp.z1, { py: M.paving, px: M.stone, nx: M.stone });
  // concrete aprons around the house
  b.box(0.177, LEVELS.lawn, -0.65, 5.672, LEVELS.outside + 0.01, 0, { py: M.concrete, nz: M.concrete });
  b.box(1.174, LEVELS.lawn, 12.002, 11.078, LEVELS.outside + 0.01, 12.35, { py: M.concrete, pz: M.concrete });
  b.box(0.177, LEVELS.lawn, 8.483, 1.174, LEVELS.outside + 0.01, 12.35, { py: M.gravel, pz: M.concrete });
  b.box(10.227, LEVELS.lawn, 6.08, 11.08, LEVELS.courtyard - 0.015, 8.179, { py: M.paving });
  b.box(11.078, LEVELS.lawn, 8.179, 11.08, LEVELS.outside + 0.01, 12.35, { py: M.concrete });
  // stepping stones from the courtyard into the north garden
  for (let i = 0; i < 4; i++) {
    const z = -0.7 - i * 0.75;
    b.box(7.35 + (i % 2) * 0.25, LEVELS.lawn, z - 0.25, 8.15 + (i % 2) * 0.25, LEVELS.lawn + 0.025, z + 0.25, { py: M.paving, px: M.stone, nx: M.stone, pz: M.stone, nz: M.stone });
  }
  // the neighbouring twin's yard: mirrored courtyard paving, path and garden walls
  const mx = (x) => -0.06 - x;
  b.box(mx(C.x1), LEVELS.lawn, C.z0, mx(5.672), LEVELS.courtyard, C.z1, { py: M.paving, nx: M.stone, nz: M.stone });
  b.box(mx(Pp.x1), LEVELS.lawn, Pp.z0, mx(Pp.x0), LEVELS.courtyard - 0.02, Pp.z1, { py: M.paving, px: M.stone, nx: M.stone });
  b.box(mx(5.672), LEVELS.lawn, -0.65, mx(0.177), LEVELS.outside + 0.01, 0, { py: M.concrete, nz: M.concrete });
  b.box(mx(11.078), LEVELS.lawn, 12.002, mx(1.174), LEVELS.outside + 0.01, 12.35, { py: M.concrete, pz: M.concrete });
  b.box(mx(Pp.x0), LEVELS.lawn - 0.3, L.z0 - 6, L.x0 - 6, LEVELS.lawn, L.z1 + 6, { py: M.grass });
  // boundary walls in Jerusalem stone
  const wallH = 1.1, wy = LEVELS.lawn;
  const stoneWall = (x0, z0, x1, z1, h = wallH) => {
    b.box(x0, wy, z0, x1, wy + h, z1, { ...ALL(M.stone), py: M.coping });
  };
  stoneWall(mx(Pp.x0), L.z0 - 0.25, L.x0, L.z0);
  stoneWall(mx(Pp.x0), L.z1, L.x0, L.z1 + 0.25);
  stoneWall(L.x0, L.z0 - 0.25, Pp.x0, L.z0);
  stoneWall(L.x0, L.z1, Pp.x0, L.z1 + 0.25);
  stoneWall(Pp.x1, L.z0 - 0.25, Pp.x1 + 0.25, 4.4);
  stoneWall(Pp.x1, 6.4, Pp.x1 + 0.25, L.z1 + 0.25);
  // party line between the twin houses (2.10 m garden wall)
  stoneWall(-0.03, L.z0, 0.15, 0, 2.3);
  stoneWall(-0.03, 8.483, 0.15, L.z1, 2.3);
  b.build(site);

  // gate pillars at the street entrance
  const gp = new Batch();
  for (const z of [4.15, 6.4]) gp.box(Pp.x1, wy, z, Pp.x1 + 0.35, wy + 1.5, z + 0.25, { ...ALL(M.stone), py: M.coping });
  gp.build(site);

  site.add(pergola(M, lights));
  site.add(outdoorFurniture(M));
  site.add(sauna(M));

  // planting
  const put = (obj, x, z, y = LEVELS.lawn, rot = 0) => { obj.position.set(x, y, z); obj.rotation.y = rot; site.add(obj); return obj; };
  put(oliveTree(M, 1.15, 1, true), 3.2, -2.7);
  put(oliveTree(M, 0.9, 2, true), 10.2, -2.4);
  put(oliveTree(M, 1.05, 3, true), 3.0, 14.0);
  put(oliveTree(M, 0.85, 4, true), 9.3, 14.3);
  for (const [x, z, h, s] of [[0.9, -3.9, 7.5, 1], [2.3, -3.95, 6.6, 2], [12.0, -3.9, 7.8, 3], [Pp.x1 + 1.2, 8.5, 8.2, 4], [Pp.x1 + 1.2, 10.4, 7.2, 5], [Pp.x1 + 1.2, 12.3, 7.9, 6], [0.8, 15.0, 6.8, 7]]) {
    put(cypressTree(M, h, s), x, z);
  }
  // lavender & rosemary along the south facade
  for (let i = 0; i < 14; i++) {
    const x = 1.6 + i * 0.68;
    put(shrub(M, 0.28, 0x6f8a5c, 300 + i, i % 2 ? 0x8b72c4 : null), x, 12.7);
  }
  // bougainvillea climbing the pergola post
  const bg = new THREE.Group();
  const rnd = seeded(77);
  const clump = (x, y, z, r) => {
    bg.add(leafCanopy(M, { count: 90, radius: [r, r, r], center: [x, y, z], leaf: [0.05, 0.08], color: 0x4f7a3c, rnd }));
    bg.add(leafCanopy(M, { count: 120, radius: [r * 1.05, r * 1.05, r * 1.05], center: [x, y, z], leaf: [0.05, 0.06], color: 0xc42d7e, rnd }));
  };
  for (let i = 0; i < 9; i++) clump((rnd() - 0.5) * 0.35, 0.3 + i * 0.32, (rnd() - 0.5) * 0.4, 0.2 + rnd() * 0.1);
  for (let i = 0; i < 8; i++) clump(-0.3 - rnd() * 1.6, 3.05 + rnd() * 0.12, (rnd() - 0.5) * 0.7 + 0.25, 0.22 + rnd() * 0.1);
  const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 3.0, 6), M.bark);
  vine.position.set(0.05, 1.5, 0.05);
  bg.add(vine);
  put(bg, SITE.pergola.x1 - 0.05, SITE.pergola.z0 + 0.15, LEVELS.courtyard);
  // planters along the north apron
  for (const x of [0.6, 1.6]) put(shrub(M, 0.32, 0x5f7f4a, 900 + x * 10, 0xe9e2d0), x, -0.9);
  // potted plants on the courtyard
  site.add(potted(M, 'lemon', 6.25, 0.45));
  site.add(potted(M, 'olive', 9.35, 5.65));
  site.add(potted(M, 'fig', 6.3, 5.75));

  // a pair of sun loungers in the north garden
  const lb = new Batch();
  for (const x of [4.6, 5.5]) {
    lb.box(x, LEVELS.lawn, -3.2, x + 0.7, LEVELS.lawn + 0.32, -1.25, ALL(M.veneerDark));
    lb.box(x + 0.03, LEVELS.lawn + 0.32, -3.15, x + 0.67, LEVELS.lawn + 0.38, -1.3, ALL(M.fabricSofa));
  }
  lb.build(site);

  site.add(neighbourhood(M, height));
  return { heightAt: height };
}

function potted(M, kind, x, z) {
  const g = new THREE.Group();
  const pot = mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.55, 24), M.potGrey);
  pot.position.y = 0.275;
  g.add(pot);
  if (kind === 'olive') {
    const t = oliveTree(M, 0.55, 9, true);
    t.position.y = 0.5;
    g.add(t);
  } else {
    const rnd = seeded(kind.length * 7 + Math.round(x));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 8), M.bark).translateY(0.95));
    g.add(leafCanopy(M, {
      count: kind === 'lemon' ? 520 : 140,
      radius: [0.42, 0.42, 0.42],
      center: [0, 1.5, 0],
      leaf: kind === 'lemon' ? [0.07, 0.13] : [0.14, 0.24],
      color: kind === 'lemon' ? 0x4f7a3c : 0x456e34,
      rnd,
    }));
    if (kind === 'lemon') {
      const fruit = new THREE.MeshStandardMaterial({ color: 0xf2d13a, roughness: 0.45 });
      for (let i = 0; i < 10; i++) {
        const f = mesh(new THREE.SphereGeometry(0.04, 10, 8), fruit);
        const a = rnd() * Math.PI * 2;
        f.position.set(Math.cos(a) * 0.3, 1.3 + rnd() * 0.4, Math.sin(a) * 0.3);
        g.add(f);
      }
    }
  }
  g.position.set(x, LEVELS.courtyard, z);
  return g;
}
