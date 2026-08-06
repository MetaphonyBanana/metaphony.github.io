import * as THREE from 'three';

// 概念YZ平面(world +X/+Y象限、world Z=0)上に置く、クリック判定専用の透明な板。
// Y軸・Z軸が伸びている正の象限あたりをカバーする。
// 見た目には出さず(opacity:0)、レイキャストの当たり判定にだけ使う。
export function createYZTriggerZone(scene, size = 24) {
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(size / 2 - 3, size / 2 - 3, 0);
  scene.add(mesh);
  return mesh;
}
