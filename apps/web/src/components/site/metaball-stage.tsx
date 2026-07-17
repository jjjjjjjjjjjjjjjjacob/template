import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** The four blob choreographies from the soluo hero. */
export type MetaballVariant = 'orbs' | 'strand' | 'cluster' | 'halo';
/** How the cursor perturbs the field. */
export type MetaballCursorMode = 'attract' | 'repel' | 'trail';

/* Fragment shader — raymarched metaball scene. Ported verbatim from the soluo
   hero (../soluo/components/metaball-stage.tsx) so the visual output matches.
   Uniforms:
     uVariant     0=orbs 1=strand 2=cluster 3=halo
     uCursorMode  0=attract 1=repel 2=trail
     uLight       1.0 for light palettes (keeps blob brighter than bg) */
const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec2  uRes;
uniform vec2  uCursor;
uniform float uCursorStr;
uniform int   uVariant;
uniform int   uCursorMode;
uniform vec3  uBg;
uniform vec3  uInk;
uniform vec3  uFg;
uniform vec3  uAccent;
uniform vec3  uAccent2;
uniform float uIntensity;
uniform float uLight;
uniform vec2  uClick;
uniform float uClickAge;
uniform float uClickStr;

float sdSphere(vec3 p, float r){ return length(p)-r; }

float smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

float hash(vec3 p){ return fract(sin(dot(p, vec3(7.1,157.3,113.7)))*43758.5453); }

struct Hit { float d; vec3 col; };

Hit sceneOrbs(vec3 p, vec3 cur){
  float t = uTime*0.35;
  vec3 p1 = vec3(sin(t*1.1)*0.8, cos(t*0.9)*0.5, sin(t*0.7)*0.4);
  vec3 p2 = vec3(cos(t*0.8)*-0.9, sin(t*1.2)*0.6, cos(t*0.6)*0.5);
  vec3 p3 = vec3(sin(t*0.6)*0.5, cos(t*0.7)*-0.8, sin(t*1.0)*0.3);
  vec3 p4 = cur;

  float d1 = sdSphere(p - p1, 0.55);
  float d2 = sdSphere(p - p2, 0.45);
  float d3 = sdSphere(p - p3, 0.50);
  float d4 = sdSphere(p - p4, 0.38);

  float k = 0.65;
  float d = smin(d1, d2, k);
  d = smin(d, d3, k);
  d = smin(d, d4, k);

  float w1 = exp(-d1*3.0);
  float w2 = exp(-d2*3.0);
  float w3 = exp(-d3*3.0);
  float w4 = exp(-d4*3.0);
  float wS = w1+w2+w3+w4+1e-4;
  vec3 col = (uAccent*w1 + uAccent2*w2 + mix(uAccent,uAccent2,0.5)*w3 + uFg*w4)/wS;
  return Hit(d, col);
}

Hit sceneStrand(vec3 p, vec3 cur){
  float t = uTime*0.4;
  float d = 1e5;
  vec3 col = uAccent;
  for (int i=0;i<9;i++){
    float fi = float(i)-4.0;
    vec3 c = vec3(fi*0.32, sin(fi*0.7+t)*0.5, cos(fi*0.5+t*0.8)*0.35);
    c.xy += (cur.xy - c.xy)*0.18*smoothstep(1.2, 0.0, abs(fi)*0.25);
    float ds = sdSphere(p - c, 0.32);
    d = smin(d, ds, 0.45);
    float w = exp(-ds*4.0);
    col = mix(col, mix(uAccent, uAccent2, 0.5 + 0.5*sin(fi*0.6+t)), clamp(w,0.0,1.0));
  }
  float dc = sdSphere(p - cur, 0.30);
  d = smin(d, dc, 0.4);
  return Hit(d, col);
}

Hit sceneCluster(vec3 p, vec3 cur){
  float t = uTime*0.3;
  float d = 1e5;
  vec3 col = uFg;
  for (int i=0;i<12;i++){
    float fi = float(i);
    float a = fi*0.78 + t;
    float r = 0.7 + 0.2*sin(fi*1.3 + t*1.5);
    vec3 c = vec3(cos(a)*r, sin(a*0.7)*r*0.8, sin(a*1.1)*r*0.6);
    c += (cur - c)*0.12;
    float ds = sdSphere(p - c, 0.28 + 0.05*sin(fi+t*2.0));
    d = smin(d, ds, 0.38);
    float w = exp(-ds*3.5);
    vec3 cc = mix(uAccent, uAccent2, 0.5+0.5*sin(fi*0.7+t));
    col = mix(col, cc, clamp(w,0.0,1.0));
  }
  return Hit(d, col);
}

Hit sceneHalo(vec3 p, vec3 cur){
  float t = uTime*0.5;
  float d = sdSphere(p, 0.72);
  vec3 col = uAccent;
  for (int i=0;i<8;i++){
    float fi = float(i);
    float a = fi*0.7853 + t*0.8;
    vec3 c = cur + vec3(cos(a)*0.75, sin(a)*0.75, sin(a*1.5)*0.2);
    float ds = sdSphere(p - c, 0.22);
    d = smin(d, ds, 0.35);
    float w = exp(-ds*5.0);
    col = mix(col, uAccent2, clamp(w,0.0,1.0));
  }
  float dc = sdSphere(p - cur, 0.26);
  d = smin(d, dc, 0.3);
  return Hit(d, col);
}

// Anchor the click effect to the blob. A click on or near the blob (within
// radius R of the origin, where the blob sits) pokes exactly where you clicked;
// a click further out clamps to the nearest edge so nothing spawns in empty
// space. R ~ blob outer radius (tunable).
vec2 clickAnchor(){
  vec2 c = vec2(uClick.x * (uRes.x / uRes.y), uClick.y) * 2.0;
  float L = length(c);
  float R = 1.3;
  return L > R ? c * (R / L) : c;
}

Hit map(vec3 p, vec3 cur){
  // Click shockwave: double-ring domain warp shoves nearby metaballs outward
  // in a fast wavefront followed by a slower trailing wave.
  if (uClickStr > 0.0) {
    vec2 clickWorld = clickAnchor(); // on-blob: poke there; off-blob: clamp to edge
    vec2 toClick = p.xy - clickWorld;
    float dist = length(toClick);
    float age = max(0.0, uClickAge);
    float decay = 1.0 - clamp(age / 1.4, 0.0, 1.0);
    float wave1 = exp(-pow((dist - age * 2.4) * 2.5, 2.0));
    float wave2 = exp(-pow((dist - age * 1.2) * 3.5, 2.0)) * 0.7;
    float ring = (wave1 + wave2) * decay;
    // Soften the warp at the epicenter so the click dents the field instead of
    // punching a deep void; the travelling ring (dist >= 0.5) keeps full push.
    float centerFade = mix(0.3, 1.0, smoothstep(0.0, 0.5, dist));
    vec2 dir = dist > 1e-4 ? toClick / dist : vec2(0.0);
    p.xy -= dir * ring * 0.55 * centerFade;
  }

  Hit hit;
  if (uVariant == 0) hit = sceneOrbs(p, cur);
  else if (uVariant == 1) hit = sceneStrand(p, cur);
  else if (uVariant == 2) hit = sceneCluster(p, cur);
  else hit = sceneHalo(p, cur);

  // Click splat + shrapnel: bright core swells and collapses, six metaball
  // droplets fly outward at varied angles and speeds.
  if (uClickStr > 0.0) {
    vec2 clickWorld = clickAnchor(); // on-blob: poke there; off-blob: clamp to edge
    float age = max(0.0, uClickAge);
    float t01 = clamp(age / 1.4, 0.0, 1.0);

    float splatR = 0.7 * sin(t01 * 3.14159) * exp(-age * 1.0);
    if (splatR > 0.025) {
      float ds = sdSphere(p - vec3(clickWorld, 0.0), splatR);
      hit.d = smin(hit.d, ds, 0.55);
      float w = exp(-ds * 3.0);
      vec3 splatCol = mix(uAccent, uAccent2, 0.5 + 0.5 * sin(age * 8.0));
      hit.col = mix(hit.col, splatCol, clamp(w, 0.0, 1.0));
    }

    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float seed = hash(vec3(fi * 7.13, fi * 3.71, 5.0));
      float seed2 = hash(vec3(fi * 2.7, 9.1, fi * 1.3));
      float ang = fi * 1.0472 + seed * 1.7;
      float speed = 1.6 + 0.9 * seed2;
      vec2 sdir = vec2(cos(ang), sin(ang));
      float zoff = (seed - 0.5) * 0.4;
      vec3 sat = vec3(clickWorld + sdir * age * speed, zoff);
      float satR = (0.20 + 0.08 * seed) * exp(-age * 1.4) * (1.0 - t01);
      if (satR > 0.03) {
        float ds = sdSphere(p - sat, satR);
        hit.d = smin(hit.d, ds, 0.3);
        float w = exp(-ds * 4.0);
        hit.col = mix(hit.col, mix(uAccent, uAccent2, seed2), clamp(w, 0.0, 1.0));
      }
    }
  }

  return hit;
}

vec3 calcNormal(vec3 p, vec3 cur){
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    map(p+e.xyy,cur).d - map(p-e.xyy,cur).d,
    map(p+e.yxy,cur).d - map(p-e.yxy,cur).d,
    map(p+e.yyx,cur).d - map(p-e.yyx,cur).d
  ));
}

void main(){
  vec2 uv = (vUv*2.0 - 1.0);
  uv.x *= uRes.x / uRes.y;

  vec3 cur = vec3(uCursor*1.2, 0.2) * uCursorStr;
  if (uCursorMode == 1) cur = -cur;

  vec3 ro = vec3(0.0, 0.0, 3.2);
  vec3 rd = normalize(vec3(uv, -1.6));

  float tAcc = 0.0;
  vec3 col = uBg;
  float glow = 0.0;
  bool hit = false;
  vec3 hitCol = vec3(0.0);
  vec3 nrm = vec3(0.0);
  vec3 pos = vec3(0.0);

  for (int i=0;i<80;i++){
    vec3 p = ro + rd*tAcc;
    Hit h = map(p, cur);
    glow += exp(-abs(h.d)*12.0) * 0.02;
    if (h.d < 0.0015){
      hit = true;
      hitCol = h.col;
      pos = p;
      nrm = calcNormal(p, cur);
      break;
    }
    tAcc += max(0.01, h.d*0.8);
    if (tAcc > 6.0) break;
  }

  if (hit){
    vec3 L = normalize(vec3(0.6, 0.9, 0.7));
    float diff = clamp(dot(nrm, L), 0.0, 1.0);
    float fres = pow(1.0 - clamp(dot(-rd, nrm), 0.0, 1.0), 2.5);
    vec3 shade;
    if (uLight > 0.5) {
      shade = mix(hitCol, vec3(1.0), 0.45 * diff);
      shade = mix(shade, vec3(1.0), fres * 0.7);
      shade *= 0.96 + 0.04*hash(pos*8.0);
    } else {
      shade = hitCol * (0.35 + 0.65*diff);
      shade += fres * mix(uAccent2, vec3(1.0), 0.35) * 0.9;
      shade *= 0.92 + 0.08*hash(pos*8.0);
    }
    col = mix(uBg, shade, 0.98);
  }

  float clickBoost = 1.0 + uClickStr * 2.5 * exp(-max(0.0, uClickAge) * 2.0);
  col += glow * mix(uAccent, uAccent2, 0.5) * uIntensity * clickBoost;

  float vig = 1.0 - 0.25*length(uv*0.55);
  col *= vig;

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const VARIANT_IDX: Record<MetaballVariant, number> = {
  orbs: 0,
  strand: 1,
  cluster: 2,
  halo: 3,
};

const CURSOR_IDX: Record<MetaballCursorMode, number> = {
  attract: 0,
  repel: 1,
  trail: 2,
};

interface MetaballStageProps {
  variant?: MetaballVariant;
  cursorMode?: MetaballCursorMode;
  /** 0..2. Clamped to 0.6 on light palettes (per the soluo handoff). */
  intensity?: number;
  /** Page background the blob sits on (hex). */
  bg?: string;
  /** Darkest ink, used as the blob base on dark palettes. */
  ink?: string;
  /** Two blob tints; switching projects lerps toward the new pair. */
  accent?: string;
  accent2?: string;
  /** Light palette path keeps the blob brighter than the bg. */
  light?: boolean;
}

/**
 * The soluo morph metaball, adapted for the template. Unlike the soluo hero
 * (Next.js, `dynamic(ssr:false)`), this drives three.js imperatively inside an
 * effect, so it never touches WebGL during SSR — no client gate needed. Palette
 * props are smoothly interpolated each frame, so changing the focused project
 * morphs the blob's colour and choreography instead of hard-cutting.
 */
export function MetaballStage({
  variant = 'orbs',
  cursorMode = 'trail',
  intensity = 0.55,
  bg = '#efeeea',
  ink = '#1a1a18',
  accent = '#e4e0f0',
  accent2 = '#f1e0e6',
  light = true,
}: MetaballStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const uniformsRef = useRef<Record<string, THREE.IUniform> | null>(null);
  // Colour targets the render loop eases toward (one lerp step per frame).
  const targetRef = useRef({
    bg: new THREE.Color(bg),
    fg: new THREE.Color(light ? accent2 : ink),
    accent: new THREE.Color(accent),
    accent2: new THREE.Color(accent2),
  });
  const lightRef = useRef(light);
  const dampRef = useRef(cursorMode === 'trail' ? 0.04 : 0.12);

  // ---- mount once: build renderer, run the RAF loop ----------------------
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally constrained dependencies
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();

    const uIntensity = light ? Math.min(intensity, 0.6) : intensity;

    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uCursor: { value: new THREE.Vector2(0, 0) },
      uCursorStr: { value: 1.0 },
      uVariant: { value: VARIANT_IDX[variant] },
      uCursorMode: { value: CURSOR_IDX[cursorMode] },
      uBg: { value: new THREE.Color(bg) },
      uInk: { value: new THREE.Color(ink) },
      uFg: { value: new THREE.Color(light ? accent2 : ink) },
      uAccent: { value: new THREE.Color(accent) },
      uAccent2: { value: new THREE.Color(accent2) },
      uIntensity: { value: uIntensity },
      uLight: { value: light ? 1.0 : 0.0 },
      uClick: { value: new THREE.Vector2(0, 0) },
      uClickAge: { value: -1 },
      uClickStr: { value: 0 },
    };
    uniformsRef.current = uniforms;

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geo, material);
    scene.add(mesh);

    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Resize in lockstep with render: setSize() reallocates and clears the WebGL
    // buffer, so the observer only flags and renderFrame() applies the pending
    // resize right before drawing — otherwise a cleared buffer composites as a
    // black flash mid-resize.
    let needsResize = true;
    const applyResize = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      renderer.setSize(w, h, false);
      (uniforms.uRes.value as THREE.Vector2).set(w, h);
      needsResize = false;
    };
    const renderFrame = () => {
      if (needsResize) applyResize();
      renderer.render(scene, camera);
    };
    const ro = new ResizeObserver(() => {
      needsResize = true;
      if (reduced) renderFrame(); // no RAF loop in reduced-motion mode
    });
    ro.observe(el);

    // Smoothed cursor in clip-space; damp is read from a ref so cursorMode can
    // change without tearing down the renderer.
    const cur = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      cur.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      cur.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove);

    // Click shockwave + splat anywhere on the page. We don't preventDefault, so
    // links and buttons keep working.
    const click = { x: 0, y: 0, t0: -1 };
    const CLICK_LIFE = 1.4;
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      const r = el.getBoundingClientRect();
      click.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      click.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      click.t0 = performance.now();
    };
    window.addEventListener('pointerdown', onDown);

    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      // Skip GPU work while the tab is hidden.
      if (document.hidden) return;

      const now = performance.now();
      uniforms.uTime.value = (now - t0) / 1000;

      const damp = dampRef.current;
      cur.x += (cur.tx - cur.x) * damp;
      cur.y += (cur.ty - cur.y) * damp;
      (uniforms.uCursor.value as THREE.Vector2).set(cur.x, cur.y);

      // Ease palette toward the active project's target colours.
      const tgt = targetRef.current;
      (uniforms.uBg.value as THREE.Color).lerp(tgt.bg, 0.06);
      (uniforms.uFg.value as THREE.Color).lerp(tgt.fg, 0.06);
      (uniforms.uAccent.value as THREE.Color).lerp(tgt.accent, 0.06);
      (uniforms.uAccent2.value as THREE.Color).lerp(tgt.accent2, 0.06);

      if (click.t0 > 0) {
        const age = (now - click.t0) / 1000;
        if (age >= CLICK_LIFE) {
          click.t0 = -1;
          uniforms.uClickStr.value = 0;
          uniforms.uClickAge.value = -1;
        } else {
          uniforms.uClickStr.value = 1;
          uniforms.uClickAge.value = age;
          (uniforms.uClick.value as THREE.Vector2).set(click.x, click.y);
        }
      }

      renderFrame();
    };

    if (reduced) {
      renderFrame();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      uniformsRef.current = null;
      geo.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
    // Build once; live updates flow through the sync effect below.
  }, []);

  // ---- live sync: update uniforms/targets when props change --------------
  useEffect(() => {
    dampRef.current = cursorMode === 'trail' ? 0.04 : 0.12;
    const themeChanged = lightRef.current !== light;
    const tgt = targetRef.current;
    tgt.bg.set(bg);
    tgt.fg.set(light ? accent2 : ink);
    tgt.accent.set(accent);
    tgt.accent2.set(accent2);

    const u = uniformsRef.current;
    if (!u) return;
    u.uVariant.value = VARIANT_IDX[variant];
    u.uCursorMode.value = CURSOR_IDX[cursorMode];
    u.uIntensity.value = light ? Math.min(intensity, 0.6) : intensity;
    u.uLight.value = light ? 1.0 : 0.0;
    (u.uInk.value as THREE.Color).set(ink);

    // Project palettes morph within a theme, but a theme swap must be atomic.
    // Otherwise the masked canvas briefly eases from the light page background
    // to the dark one, which reads as a full black-to-white split.
    if (themeChanged) {
      (u.uBg.value as THREE.Color).set(bg);
      (u.uFg.value as THREE.Color).set(light ? accent2 : ink);
      (u.uAccent.value as THREE.Color).set(accent);
      (u.uAccent2.value as THREE.Color).set(accent2);
    }

    lightRef.current = light;
  }, [variant, cursorMode, intensity, bg, ink, accent, accent2, light]);

  return <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />;
}
