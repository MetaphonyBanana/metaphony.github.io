let t = 0;

let grid = [];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  for (let z = -40; z < 40; z++) {
    for (let x = -40; x < 40; x++) {
      grid.push({
        x,
        z,
        health: 0
      });
    }
  }
}

function draw() {
  background(0);

  camera(0, -600, 600, 0, 0, 0, 0, 1, 0);

  stroke(255, 200);
  strokeWeight(2);
  noFill();

  const scl = 10;

  let mx = mouseX - width / 2;
  let my = mouseY - height / 2;

  for (let p of grid) {

    let r = sqrt(p.x * p.x + p.z * p.z);

    let waveEnvelope = exp(-pow(r - t * 4, 2) / 40);

    let base = waveEnvelope * sin(r * 0.8 - t * 6);

    let sx = p.x * scl;
    let sz = p.z * scl;

    let dMouse = dist(sx, sz, mx, my);

    // 遅延崩壊（入力の非線形化）
    let target = dMouse < 80 ? 1 : 0;
    p.health += (target - p.health) * 0.08;

    // 崩壊境界だけ揺らす
    let edge = smoothstep(0.3, 0.75, p.health);
    let jitter = (noise(p.x * 0.9, p.z * 0.9, t* 3.5) - 0.1) * edge * 28;

    if (p.health > 0.98) continue;

    let y = base * 60 + jitter;

    point(sx, y, sz);
  }

  t += 0.03;

  document.getElementById("tval").innerText = t.toFixed(2);
}

function smoothstep(a, b, x) {
  let t = constrain((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}