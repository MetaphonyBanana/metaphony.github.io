import * as THREE from 'three';
import { AXIS_LENGTH, AXIS_WORLD_DIR } from './config.js';
import { getAxisStationView } from './axisCamera.js';
import { makeTextSprite } from './axisLabels.js';
import { AXIS_CONTENT } from './data/axisContent.js';

// ── 軸ステーション限定の追加表示(X軸・Y軸) ────────
// 軸クリックでその軸のステーションへカメラが到達している間だけ、
//   1) 軸ラベルの文字を消す(main.js側でaxisLabels.sprites[name]を操作)
//   2) 点(クリックできるもの/持続表示のタイトル付きのもの)を出す
// をまとめて main.js から showX()/showY() で切り替える。
// カメラが動いたら(main.js側でcontrolsの'change'を監視して)hideX()/hideY()を呼び、元の状態に戻す。
//
// Y軸: 終端にクリック可能な点(クリックで"Teddy"を表示) + 軸中央の下に持続タイトル"Nine Stories"
// X軸: 終端に持続タイトル"The Catcher in the Rye"(点の上に表示) + 原点付近にクリック可能な点(クリックで"Central Park"を表示)

const DOT_RADIUS = 0.35;          // hotspots.jsの星と同じスケール感
const DOT_COLOR = 0x4fd6ff;       // ← bloomThreshold(0.35)を超える明るい青。軸(0xbfe9ff)より彩度を上げて発光が映えるようにした
const TITLE_OFFSET = 2.6;         // 軸中央/終端点から、タイトルをどれだけ離すか

// 「点」はhotspots.jsの星と同じく、明るい色のシンプルな球にする。
// bloomパス(bloomThreshold=0.35)が明るい色をそのまま光らせてくれるので、
// 特別なシェーダーを使わずMeshBasicMaterialの色だけで「発光する点」に見える。
function makeDot() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(DOT_RADIUS, 16, 16),
    new THREE.MeshBasicMaterial({ color: DOT_COLOR })
  );
}

// 持続タイトル(Nine Stories / The Catcher in the Rye)用の暗めテキスト設定。
// 明るい既定色だとblurと相まって滲んで見えにくかったため、明度を落とす。
const TITLE_TEXT_OPTS = {
  textColor: '#6f93a3',
  shadowColor: '#8fbcd0',
  shadowBlurFactor: 0.03,
};

export function createAxisStationOverlay(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // ── Y軸 ──────────────────────────────────────
  const yStationView = getAxisStationView(AXIS_WORLD_DIR.Y, AXIS_LENGTH);

  const yEndDot = makeDot();
  yEndDot.position.copy(AXIS_WORLD_DIR.Y.clone().normalize().multiplyScalar(AXIS_LENGTH));
  yEndDot.userData.axisName = 'Y';
  yEndDot.userData.contentKey = 'end';
  yEndDot.visible = false;
  group.add(yEndDot);

  const yTitleSprite = makeTextSprite(AXIS_CONTENT.Y.axis?.title || '', {
    canvasWidth: 1024, canvasHeight: 320, fontPx: 152, worldWidth: 12.8, worldHeight: 4.0, // ← 2倍サイズ(将来のGlass Sagaタイトルも同サイズを使う想定)
    ...TITLE_TEXT_OPTS,
  });
  const yMid = AXIS_WORLD_DIR.Y.clone().normalize().multiplyScalar(AXIS_LENGTH / 2);
  // 「下」はワールド座標の-Yではなく、Y軸ステーションのカメラup方向の逆側
  // (=このステーションから見て画面下に見える方向)を使う。
  yTitleSprite.position.copy(yMid.clone().addScaledVector(yStationView.up, -TITLE_OFFSET));
  yTitleSprite.visible = false;
  group.add(yTitleSprite);

  function showY() {
    yEndDot.visible = true;
    yTitleSprite.visible = true;
  }
  function hideY() {
    yEndDot.visible = false;
    yTitleSprite.visible = false;
  }

  // ── X軸 ──────────────────────────────────────
  const xStationView = getAxisStationView(AXIS_WORLD_DIR.X, AXIS_LENGTH);

  // 終端の点(持続表示。クリック操作は無し)
  const xEndDot = makeDot();
  xEndDot.position.copy(AXIS_WORLD_DIR.X.clone().normalize().multiplyScalar(AXIS_LENGTH));
  xEndDot.userData.axisName = 'X';
  xEndDot.userData.contentKey = 'end'; // ← Yのend(Teddy)と同じ仕組みでクリック対応(main.js側)
  xEndDot.visible = false;
  group.add(xEndDot);

  // 終端点の「上」に持続タイトル("The Catcher in the Rye")
  const xTitleSprite = makeTextSprite(AXIS_CONTENT.X.axis?.title || '', {
    canvasWidth: 1280, canvasHeight: 320, fontPx: 124, worldWidth: 15.6, worldHeight: 3.8, // ← 2倍サイズ(将来のGlass Sagaタイトルも同サイズを使う想定)
    ...TITLE_TEXT_OPTS,
  });
  xTitleSprite.position.copy(xEndDot.position.clone().addScaledVector(xStationView.up, TITLE_OFFSET));
  xTitleSprite.visible = false;
  group.add(xTitleSprite);

  // 原点側の点(クリックで"Central Park"を表示。Yのend/Teddyと同じ形式)。
  // バナナ(Bananafishオブジェクト)は演出上、割れて飛び散った後は画面上で非表示になる
  // (visible=falseだとraycastも自動的にスキップされる)ため、避ける必要は無い。
  // 素直に原点(0,0,0)へ置く。
  const xOriginDot = makeDot();
  xOriginDot.position.set(0, 0, 0);
  xOriginDot.userData.axisName = 'X';
  xOriginDot.userData.contentKey = 'origin';
  xOriginDot.visible = false;
  group.add(xOriginDot);

  function showX() {
    xEndDot.visible = true;
    xTitleSprite.visible = true;
    xOriginDot.visible = true;
  }
  function hideX() {
    xEndDot.visible = false;
    xTitleSprite.visible = false;
    xOriginDot.visible = false;
  }

  // ── Z軸 ──────────────────────────────────────
  // Yと同じく持続タイトル(axis)は無し。原点・終端ともにクリックで表示する点のみ(X原点/Yend/Teddyと同じ形式)。
  const zEndDot = makeDot();
  zEndDot.position.copy(AXIS_WORLD_DIR.Z.clone().normalize().multiplyScalar(AXIS_LENGTH));
  zEndDot.userData.axisName = 'Z';
  zEndDot.userData.contentKey = 'end';
  zEndDot.visible = false;
  group.add(zEndDot);

  const zOriginDot = makeDot();
  zOriginDot.position.set(0, 0, 0);
  zOriginDot.userData.axisName = 'Z';
  zOriginDot.userData.contentKey = 'origin';
  zOriginDot.visible = false;
  group.add(zOriginDot);

  function showZ() {
    zEndDot.visible = true;
    zOriginDot.visible = true;
  }
  function hideZ() {
    zEndDot.visible = false;
    zOriginDot.visible = false;
  }

  return {
    group,
    yEndDot, yTitleSprite, showY, hideY,
    xEndDot, xTitleSprite, xOriginDot, showX, hideX,
    zEndDot, zOriginDot, showZ, hideZ,
  };
}
