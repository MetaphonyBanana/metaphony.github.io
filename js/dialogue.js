import * as THREE from 'three';

// ── セリフ表示(星の真上に直接投影して表示) ─────
export function createDialogue(camera) {
  const dialogueEl = document.getElementById('dialogue');
  let dialogueTimer = null;
  let activeStar = null;                                // 現在セリフを表示中の星
  const dialogueOffset = new THREE.Vector3(0, 0.6, 0);  // 星から少し浮かせるオフセット

  function show(text, starMesh) {
    dialogueEl.textContent = text;
    dialogueEl.classList.add('show');
    activeStar = starMesh || null;
    updatePosition();
    clearTimeout(dialogueTimer);
    dialogueTimer = setTimeout(() => {
      dialogueEl.classList.remove('show');
      activeStar = null;
    }, 3200);
  }

  // activeStarのワールド座標をスクリーン座標に投影し、テキストをその真上に追従させる
  function updatePosition() {
    if (!activeStar) return;
    const v = activeStar.position.clone().add(dialogueOffset).project(camera);
    dialogueEl.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`;
    dialogueEl.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
  }

  return { show, updatePosition };
}
