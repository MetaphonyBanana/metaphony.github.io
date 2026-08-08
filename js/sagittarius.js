import * as THREE from 'three';

// ── 射手座(「ティーポット」型のアステリズムを星+線で表現) ──
// 中心(ARCHER_POS)からのオフセットで各星を配置。500スケールの奥行きでも
// くっきり読み取れるよう、頂点間の間隔を大きめ(数十単位)に取っている。
const SAGITTARIUS_SHAPE = [
  [  0,  20,   0 ], // 0 蓋
  [-22,  10,   4 ], // 1 左のふち
  [-26,  -8,   0 ], // 2 左肩
  [-16, -24,  -3 ], // 3 左下(底)
  [ 14, -24,   3 ], // 4 右下(底)
  [ 26,  -8,   0 ], // 5 右肩(注ぎ口の付け根)
  [ 40,   6,  -4 ], // 6 注ぎ口の先
  [-38,   2,   5 ], // 7 持ち手
];
const SAGITTARIUS_EDGES = [
  [0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [5,0], // 本体の輪郭+注ぎ口
  [1,7], [7,2],                                     // 持ち手
];

export function createSagittarius(scene, center) {
  const group = new THREE.Group();
  group.position.copy(center);

  const starMat = new THREE.MeshBasicMaterial({ color: 0xffe6b3 });
  const starGeo = new THREE.SphereGeometry(1.1, 12, 12);
  const stars = SAGITTARIUS_SHAPE.map(([x, y, z]) => {
    const s = new THREE.Mesh(starGeo, starMat);
    s.position.set(x, y, z);
    group.add(s);
    return s;
  });

  const linePts = [];
  SAGITTARIUS_EDGES.forEach(([a, b]) => linePts.push(stars[a].position, stars[b].position));
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(linePts),
    new THREE.LineBasicMaterial({ color: 0xffe6b3, transparent: true, opacity: 0.4 })
  );
  group.add(lines);

  scene.add(group);
  return group;
}
