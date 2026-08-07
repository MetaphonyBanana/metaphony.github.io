import * as THREE from 'three';

// ── 星に紐づくセリフ(位置と台詞のペア) ───────────
const HOTSPOTS = [
 //X
  { pos: [-40, -90, 180],  text: 'It\'s "If a body meet a body coming through the rye"!\n─Phoebe Caulfield ' },
  { pos: [-80, -130, 100],  text: 'This is a people shooting hat.\n─Holden Caulfield' },
  { pos: [-200, -150, 200],  text: 'Go home and get your bike and meet me in front of Bobby\'s house. Hurry up.\n─Holden Caulfield' },
  { pos: [-130, -200, 40],  text: 'Mine came from Mark Cross.\n─Holden Caulfield' },
  //Y
  { pos: [250, -150, -90],  text: 'Life is a gift horse in my opinion\n─Teddy' },
  { pos: [30, -70, -150],  text: 'Did the tigers run all around that tree?\n─Sybil Carpenter' },
  { pos: [30, -150, -80],  text: 'What did one wall say to the other wall?\n─Charles' },
  //Z
  { pos: [-100, 250, -140], text: 'All we do our whole lives is go from one little piece of Holy Ground to the next.\n─Seymour Glass' },
  { pos: [-70, 40, -140], text: 'I was Mercury himself.\n─Buddy Glass' },
  { pos: [-140,160, -200],   text: 'Keep me up till five only because all your stars are out, and for other reason.\n─Seymour Glass' },
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
