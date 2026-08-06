import * as THREE from 'three';
// gsapは index.html でグローバル読み込みしているため、ここでは import せずそのまま使う。

const FELT_COLOR = 0x0b6e4f;
const RAIL_COLOR = 0x3a2417;
const LEG_COLOR  = 0x2a1a10;

// ボール色(9〜15は本来ストライプだが、v1では単色で簡略化)
const BALL_COLORS = [
  0xffffff, 0xdede1a, 0x1c3fd6, 0xd21f1f, 0x5b2a86, 0xe07a1c, 0x0e7a3d, 0x7a1420, 0x111111,
  0xdede1a, 0x1c3fd6, 0xd21f1f, 0x5b2a86, 0xe07a1c, 0x0e7a3d, 0x7a1420,
];

// ── テーブル本体(スレート+レール+脚+ポケット)とボールをプリミティブで生成 ──
// 出現演出用に、最初はscaleを極小(0.001)にしておく。
export function createBilliardTable(scene, center, opts = {}) {
  const { length = 10, width = 5, height = 2.6 } = opts;
  const group = new THREE.Group();
  group.position.copy(center);
  group.scale.set(0.001, 0.001, 0.001);

  // 脚
  const legMat = new THREE.MeshStandardMaterial({ color: LEG_COLOR, roughness: 0.6 });
  const legGeo = new THREE.CylinderGeometry(0.18, 0.22, height, 10);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(sx * (length / 2 - 0.6), height / 2, sz * (width / 2 - 0.6));
    group.add(leg);
  });

  // スレート+フェルト
  const slateMat = new THREE.MeshStandardMaterial({ color: FELT_COLOR, roughness: 0.85 });
  const slate = new THREE.Mesh(new THREE.BoxGeometry(length, 0.3, width), slateMat);
  slate.position.y = height;
  group.add(slate);

  // レール(クッション)
  const railMat = new THREE.MeshStandardMaterial({ color: RAIL_COLOR, roughness: 0.5 });
  const railH = 0.35, railT = 0.35;
  const railY = height + 0.3 / 2 + railH / 2;
  const railLongGeo = new THREE.BoxGeometry(length + railT * 2, railH, railT);
  [-1, 1].forEach((s) => {
    const r = new THREE.Mesh(railLongGeo, railMat);
    r.position.set(0, railY, s * (width / 2 + railT / 2));
    group.add(r);
  });
  const railShortGeo = new THREE.BoxGeometry(railT, railH, width + railT * 2);
  [-1, 1].forEach((s) => {
    const r = new THREE.Mesh(railShortGeo, railMat);
    r.position.set(s * (length / 2 + railT / 2), railY, 0);
    group.add(r);
  });

  // ポケット(6箇所)
  const pocketMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const pocketGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 16);
  const pocketPositions = [
    [-length / 2, width / 2], [length / 2, width / 2],
    [-length / 2, -width / 2], [length / 2, -width / 2],
    [0, width / 2], [0, -width / 2],
  ];
  pocketPositions.forEach(([px, pz]) => {
    const p = new THREE.Mesh(pocketGeo, pocketMat);
    p.rotation.x = 0;
    p.position.set(px, height + 0.3 + 0.01, pz);
    group.add(p);
  });

  scene.add(group);

  // ボール(最初は全部非表示。rackBalls()で並べて表示する)
  const ballRadius = 0.22;
  const ballY = height + 0.3 + ballRadius;
  const ballGeo = new THREE.SphereGeometry(ballRadius, 20, 20);
  const balls = BALL_COLORS.map((color) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.05 });
    const ball = new THREE.Mesh(ballGeo, mat);
    ball.visible = false;
    group.add(ball);
    return ball;
  });

  return { group, balls, ballY, length, width, ballRadius };
}

// ── 三角ラックに並べる(balls[0]=キューボールは反対側の端に) ──
export function rackBalls(table) {
  const { balls, ballY, length, ballRadius } = table;
  const spacing = ballRadius * 2.02;
  const apexX = -length * 0.28;

  const cue = balls[0];
  cue.position.set(length * 0.32, ballY, 0);
  cue.rotation.set(0, 0, 0);
  cue.visible = true;

  let i = 1;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      if (i >= balls.length) break;
      const b = balls[i++];
      b.position.set(apexX - row * spacing * 0.87, ballY, (col - row / 2) * spacing);
      b.rotation.set(0, 0, 0);
      b.visible = true;
    }
  }
}

// ── ブレイクショット: キューボールがラックに突っ込み、残りが放射状に散る ──
// (簡易版: 実際の衝突physicsは計算せず、キーフレームでそれらしく散らす)
export function playBreakShot(table, opts = {}) {
  const { onComplete } = opts;
  const { balls, length } = table;
  const cue = balls[0];
  const tl = gsap.timeline({ onComplete });

  tl.to(cue.position, { x: -length * 0.22, duration: 0.9, ease: 'power2.in' });
  tl.to(cue.rotation, { z: '+=12', duration: 0.9, ease: 'power2.in' }, '<');

  tl.add(() => {
    for (let i = 1; i < balls.length; i++) {
      const b = balls[i];
      const angle = Math.PI + (Math.random() - 0.5) * 1.6; // だいたい-X方向を中心に扇状に散る
      const dist = 2.4 + Math.random() * 3.2;
      gsap.to(b.position, {
        x: b.position.x + Math.cos(angle) * dist,
        z: b.position.z + Math.sin(angle) * dist,
        duration: 1.6 + Math.random() * 0.6,
        ease: 'power3.out',
      });
      gsap.to(b.rotation, {
        x: `+=${(Math.random() - 0.5) * 20}`,
        z: `+=${(Math.random() - 0.5) * 20}`,
        duration: 1.6,
        ease: 'power3.out',
      });
    }
    // キューボール自身も軽く跳ね返る
    gsap.to(cue.position, {
      x: cue.position.x + 1.0,
      z: (Math.random() - 0.5) * 2,
      duration: 1.2,
      ease: 'power3.out',
    });
  }, '-=0.05');

  return tl;
}
