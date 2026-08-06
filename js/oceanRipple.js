import * as THREE from 'three';
// gsapは index.html でグローバル読み込みしているため、ここでは import せずそのまま使う。

// 原点(world 0,0,0)を波源として、world X-Z(地面)上に同心円状の波紋が
// 広がっていくシェーダー。uRadiusを外からtweenすることで「届いた範囲」を制御する。
export function createOceanRipple(scene, opts = {}) {
  const { size = 34, groundY = 0, color = 0x59c8e0 } = opts;

  const geo = new THREE.PlaneGeometry(size, size, 1, 1);
  geo.rotateX(-Math.PI / 2); // 地面(world X-Z)に寝かせる

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRadius: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uRadius;
      uniform vec3 uColor;
      varying vec3 vWorldPos;
      void main() {
        float dist = length(vWorldPos.xz); // world原点からの距離
        if (dist > uRadius) discard;       // まだ波が届いていない範囲は非表示
        float wave = sin(dist * 1.1 - uTime * 3.2);
        float ring = smoothstep(0.6, 1.0, wave);       // 波の輪だけを明るく見せる
        float fadeOut = 1.0 - smoothstep(uRadius * 0.55, uRadius, dist); // 波面付近は減衰
        float fadeIn = smoothstep(0.0, 1.5, dist);      // 原点直下は静かに
        float alpha = ring * fadeOut * fadeIn * 0.75;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(0, groundY, 0);
  mesh.visible = false;
  scene.add(mesh);

  return {
    mesh,
    update(time) { material.uniforms.uTime.value = time; },
    // targetRadiusまで波を広げる。durationかけてtween、完了時にonCompleteを呼ぶ。
    spread(targetRadius, duration, onComplete) {
      mesh.visible = true;
      material.uniforms.uRadius.value = 0;
      gsap.to(material.uniforms.uRadius, {
        value: targetRadius, duration, ease: 'power1.out', onComplete,
      });
    },
  };
}
