import * as THREE from 'three';
import {
  ARCHER_POS, AXIS_X_FAR, TUNE,
  AXIS_WORLD_DIR, AXIS_LENGTH, AXIS_STATION,
  HOME_CAMERA_POS, HOME_CAMERA_TARGET,
} from './config.js';
import { createSceneSetup } from './sceneSetup.js';
import { createStars } from './stars.js';
import { createSagittarius } from './sagittarius.js';
import { createArrow } from './introActors.js';
import { createBanana } from './banana.js';
import { createAxes } from './axes.js';
import { createZAxisWave } from './zAxisWave.js';
import { createAxisLabels } from './axisLabels.js';
import { createAxisStationLabels } from './axisStationLabels.js';
import { createHotspots } from './hotspots.js';
import { createDialogue } from './dialogue.js';
import { createIntroSequence } from './introSequence.js';
import { getAxisStationView, flyToAxisStation } from './axisCamera.js';
// import { AXIS_CONTENT } from './data/axisContent.js'; // 軸クリック→ページ遷移の実装時に使用予定

// ── シーン一式のセットアップ ─────────────────────
const { scene, camera, renderer, controls, composer, lookTarget } = createSceneSetup();

const starField = createStars(scene, 3000);
const clock = new THREE.Clock();

const hotspotMeshes = createHotspots(scene);

const { state: bananaState, triggerShatter } = createBanana(scene);

const archer = createSagittarius(scene, ARCHER_POS);
archer.visible = false;

const arrowGroup = createArrow(scene);

const axes = createAxes(scene);
const zWave = createZAxisWave(scene); // Z軸:ガウス波束のらせん(軸到達後にreveal、その後ゆっくり位相回転)
const axisLabels = createAxisLabels(scene); // 三軸(X/Y/Z)のラベル(home状態になったら表示)
const stationLabels = createAxisStationLabels(scene); // 各軸ステーション到達時だけ見せる作品タイトル
let currentAxisStation = null; // 今どの軸のステーションにいるか('X'|'Y'|'Z'|null)

const dialogue = createDialogue(camera);

const intro = createIntroSequence({
  camera, controls, lookTarget, archer, arrowGroup,
  bananaState, triggerShatter, axes,
  TUNE, ARCHER_POS, AXIS_X_FAR,
  HOME_CAMERA_POS, HOME_CAMERA_TARGET,
});

// ── クリック処理 ───────────────────────────────
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let cameraBusy = false; // 軸間を移動中は多重クリックを無視する

renderer.domElement.addEventListener('click', (e) => {
  if (intro.getState() === 'idle') { intro.startSequence(); return; }
  if (intro.getState() !== 'home' || cameraBusy) return;

  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const starHit = raycaster.intersectObjects(hotspotMeshes)[0];
  if (starHit) { dialogue.show(starHit.object.userData.text, starHit.object); return; }

  // 今表示中の軸のラベルだけを判定対象にする(非表示のラベルは無視する)
  const visibleLabels = stationLabels.clickable.filter((s) => s.userData.axisName === currentAxisStation);
  const labelHit = raycaster.intersectObjects(visibleLabels)[0];
  if (labelHit) {
    const { node } = labelHit.object.userData;
    // TODO: node.pageUrl が用意でき次第、実際のページ遷移に差し替える
    dialogue.show(`${node.title}\n(ページは準備中)`, labelHit.object);
    return;
  }

  const axisHit = raycaster.intersectObjects(axes.axisHitAreas)[0];
  if (axisHit) {
    const name = axisHit.object.userData.axisName;
    // TODO: 到達後にAXIS_CONTENT[name].origin も参照して、原点側の点を実際に表示する(次のステップ)
    const view = getAxisStationView(AXIS_WORLD_DIR[name], AXIS_LENGTH);
    cameraBusy = true;
    currentAxisStation = null;

    if (name !== 'Z') zWave.reset(); // Z以外へ移動するときはらせんを消しておく
    stationLabels.hideAll();

    flyToAxisStation(camera, controls, view, {
      duration: AXIS_STATION.duration,
      onComplete: () => {
        cameraBusy = false;
        currentAxisStation = name;
        stationLabels.showOnly(name);
        if (name === 'Z') {
          // カメラが完全に静止してから、原点(画面左)→先端(画面右)へ
          // ガウス波束のらせんを伸ばす(その後は毎フレームupdate()でゆっくり回り続ける)
          const waveProgress = { t: 0 };
          gsap.to(waveProgress, {
            t: 1,
            duration: 2.2,
            ease: 'power2.out',
            onUpdate: () => zWave.reveal(waveProgress.t),
          });
        }
      }
    });
  }
});

// ── レンダーループ ─────────────────────────────
let labelsShown = false;
function animate() {
  requestAnimationFrame(animate);
  const state = intro.getState();
  // home状態になったら、カメラの向きは controls(自由視点)か
  // 軸ステーションへの遷移アニメーション自身が管理するので、lookTargetへの追従は止める
  if (state !== 'home') camera.lookAt(lookTarget);
  if (state === 'home' && !cameraBusy) controls.update();
  if (state === 'home' && !labelsShown) { labelsShown = true; axisLabels.show(); }
  dialogue.updatePosition();
  starField.update(clock.getElapsedTime());
  // らせんの位相回転更新でここが万一例外を投げても、レンダーループ全体(=軸クリックの見た目上の反応)が
  // 止まってしまわないようtry/catchで隔離しておく
  try { zWave.update(clock.getElapsedTime()); } catch (err) { console.error('zWave.update failed:', err); }
  bananaState.mesh.rotation.y += state === 'idle' ? 0.004 : 0;
  composer.render();
}
animate();
