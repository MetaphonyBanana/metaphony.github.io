import * as THREE from 'three';
import { AXIS_LENGTH, AXIS_WORLD_DIR } from './config.js';
import { AXIS_CONTENT } from './data/axisContent.js';

// ── 各軸「ステーション」到達時にだけ見せる作品タイトル ──────────────
// axisLabels.js の小さな"X/Y/Z"タグ(home全体で常時表示)とは別物。
// こちらはカメラがその軸のステーションに到達している間だけ見せる、大きめの
// 作品名ラベル(Nine Stories / Glass Saga / The Catcher in the Rye)。

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const FALLBACK_UP = new THREE.Vector3(0, 0, 1);

function lateralDir(axisDir) {
  const up = Math.abs(axisDir.dot(WORLD_UP)) > 0.9 ? FALLBACK_UP : WORLD_UP;
  return new THREE.Vector3().crossVectors(axisDir, up).normalize();
}

function makeTextSprite(text) {
  const canvas = document.createElement('canvas');
  const w = 512, h = 140;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `italic 600 ${h * 0.5}px "Cormorant Garamond", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#eaf6ff';
    ctx.shadowColor = '#bfe9ff';
    ctx.shadowBlur = h * 0.16;
    ctx.fillText(text, w / 2, h / 2 + h * 0.02);
  }
  draw();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { draw(); texture.needsUpdate = true; });
  }

  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const worldWidth = 4.4;
  sprite.scale.set(worldWidth, worldWidth * (h / w), 1);
  return sprite;
}

export function createAxisStationLabels(scene) {
  const perAxisGroup = { X: new THREE.Group(), Y: new THREE.Group(), Z: new THREE.Group() };
  const clickable = [];

  function addLabel(axisName, node, opts = {}) {
    if (!node || !node.title) return;
    const { along = 0.5, lateral = 1.8 } = opts;
    const dir = AXIS_WORLD_DIR[axisName].clone().normalize();
    const lat = lateralDir(dir);
    const pos = dir.clone().multiplyScalar(AXIS_LENGTH * along).addScaledVector(lat, lateral);

    const sprite = makeTextSprite(node.title);
    sprite.position.copy(pos);
    sprite.userData = { axisName, node };
    perAxisGroup[axisName].add(sprite);
    clickable.push(sprite);
  }

  // Y軸: 「Nine Stories」を軸のわきに沿わせる
  addLabel('Y', AXIS_CONTENT.Y.axis, { along: 0.5, lateral: 1.8 });

  // Z軸: 「Glass Saga」。ガウス波束(振幅2.5)と重ならないよう、十分離してかつ先端寄りに
  addLabel('Z', AXIS_CONTENT.Z.axis, { along: 0.8, lateral: 5.5 });

  // X軸: 「The Catcher in the Rye」を終端側に
  addLabel('X', AXIS_CONTENT.X.end, { along: 0.94, lateral: 1.8 });

  for (const g of Object.values(perAxisGroup)) {
    g.visible = false;
    scene.add(g);
  }

  // その軸のラベルだけ見せる(nullで全部隠す)。カメラがその軸のステーションに
  // 到達している間だけmain.js側から呼ぶ想定。
  function showOnly(axisName) {
    for (const [name, g] of Object.entries(perAxisGroup)) g.visible = (name === axisName);
  }
  function hideAll() { showOnly(null); }

  return { perAxisGroup, clickable, showOnly, hideAll };
}
