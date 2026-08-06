import * as THREE from 'three';
import { AXIS_LENGTH, AXIS_COLOR, AXIS_X_ANCHOR_Z } from './config.js';

// ── 三軸(すべて同色、初期はscale.y=0で非表示) ──
function makeAxisLine() {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, AXIS_LENGTH, 0)
  ]);
  const mat = new THREE.LineBasicMaterial({ color: AXIS_COLOR, transparent: true, opacity: 1 });
  const line = new THREE.Line(geo, mat);
  line.scale.y = 0;
  return line;
}

// ── クリック判定専用の見えない「太い」当たり判定シリンダー ──
// Lineは見た目上1px幅で、raycasterのデフォルト閾値でも狙いにくい。
// 各軸に半径を持つ円柱を重ねて、そちらをraycast対象にすることで確実にクリックできるようにする。
// (visible=falseにしても、three.jsのraycastは可視判定を見ないのでヒットテストには使える)
function makeHitCylinder(length, axisName, radius = 0.7) {
  const geo = new THREE.CylinderGeometry(radius, radius, length, 8, 1, true);
  geo.translate(0, length / 2, 0); // ピボットを原点側の端に合わせる(線の局所座標(0→length, local+Y)と一致させる)
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false }));
  mesh.userData.axisName = axisName;
  return mesh;
}

export function createAxes(scene) {
  const yAxis = makeAxisLine();
  yAxis.rotation.z = -Math.PI / 2; // local Y → world +X
  scene.add(yAxis);
  // 当たり判定はyAxisの子にすることで、回転・伸びる演出(scale.y)にそのまま追従させる
  const yHit = makeHitCylinder(AXIS_LENGTH, 'Y');
  yAxis.add(yHit);

  // Xだけは「刃跡」そのものを軸として使う。原点から伸ばすのではなく、
  // 遠方の到達点(AXIS_X_ANCHOR_Z)を固定端にして、刃(travelMarker)が
  // 原点へ向かって進むのに合わせて「すでに切られた跡」を逆向きに刻んでいく。
  const xAxisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, AXIS_X_ANCHOR_Z),
    new THREE.Vector3(0, 0, AXIS_X_ANCHOR_Z),
  ]);
  const xAxis = new THREE.Line(
    xAxisGeo,
    new THREE.LineBasicMaterial({ color: AXIS_COLOR, transparent: true, opacity: 1 })
  );
  xAxis.frustumCulled = false; // 毎フレーム頂点を書き換えるためbounding sphereが陳腐化する→カメラ角度で消える不具合を防ぐ
  scene.add(xAxis);
  // Xは頂点を直接書き換える方式(親のscaleに乗らない)なので、当たり判定は独立した円柱として置く。
  // home状態に達する頃には刃跡は原点(0,0,0)から先端(0,0,AXIS_X_ANCHOR_Z)まで描き終わっているので、
  // 完成形と同じ範囲を最初から静的に用意しておけばよい。
  const xHit = makeHitCylinder(AXIS_LENGTH, 'X');
  xHit.rotation.x = Math.PI / 2; // local +Y → world +Z
  scene.add(xHit);

  // travelMarker(刃)の現在z位置に合わせて、xAxisの「刻まれた区間」を更新する
  function updateXAxisTrail(currentZ) {
    const nearZ = THREE.MathUtils.clamp(currentZ, 0, AXIS_X_ANCHOR_Z);
    const posAttr = xAxis.geometry.attributes.position;
    posAttr.setXYZ(0, 0, 0, AXIS_X_ANCHOR_Z); // 固定端(遠方)
    posAttr.setXYZ(1, 0, 0, nearZ);           // 刃の現在地(原点へ向かって減っていく)
    posAttr.needsUpdate = true;
    xAxis.geometry.computeBoundingSphere(); // ← 追記: 更新しないとraycast用のbounding sphereが古いままヒット判定が壊れる
  }

  const zAxis = makeAxisLine(); // local Y → world +Y(そのまま)
  scene.add(zAxis);
  const zHit = makeHitCylinder(AXIS_LENGTH, 'Z');
  zAxis.add(zHit);

  const axisLines = [xAxis, yAxis, zAxis];
  const axisHitAreas = [xHit, yHit, zHit]; // ← クリック判定はこちらを使う(main.js)

  // ── Xの「刃跡」トラベルマーカー ─────────────────
  const travelMarker = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 3),
    new THREE.MeshBasicMaterial({ color: AXIS_COLOR })
  );
  travelMarker.visible = false;
  scene.add(travelMarker);

  return { xAxis, yAxis, zAxis, axisLines, axisHitAreas, travelMarker, updateXAxisTrail };
}
