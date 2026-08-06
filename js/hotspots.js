import * as THREE from 'three';

// ── 星に紐づくセリフ(位置と台詞のペア) ───────────
const HOTSPOTS = [
  { pos: [6, 8, -10],  text: 'It\'s "If a body meet a body coming through the rye"!\n─Phoebe Caulfield ' },
  { pos: [-9, 0, -0],  text: 'We know the sound of two hands clapping.\nBut what is the sound of one hand clapping?\n─A ZEN KOAN' },
  { pos: [3, -6, -14], text: 'I was Mercury himself.\n─Buddy Glass' },
  { pos: [-30, 40, 3],   text: 'Keep me up till five only because all your stars are out, and for other reason.\n─Seymour Glass' },
  { pos: [-6, -8, 100],  text: 'This is a people shooting hat.\n─Holden Caulfield' },
];

export function createHotspots(scene) {
  const hotspotMeshes = [];
  const hotspotGeo = new THREE.SphereGeometry(0.35, 12, 12);
  HOTSPOTS.forEach(h => {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
    const m = new THREE.Mesh(hotspotGeo, mat);
    m.position.set(...h.pos);
    m.userData.text = h.text;
    scene.add(m);
    hotspotMeshes.push(m);
  });
  return hotspotMeshes;
}
