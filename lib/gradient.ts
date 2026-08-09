/* The gradient — one fullscreen shader on a shared fixed canvas.
   A ribbon of light on black: four palette colours as soft radial blobs,
   double domain-warped simplex noise, per-pixel film grain as dither.
   Singleton; persists across route changes. */

import gsap from "gsap";

const VERT = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uTransform;     // scroll-driven travel
uniform float uOpacity;       // preloader bloom + section fades
uniform float uScale;         // bloom scale-down
uniform vec3  uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
uniform float uColorSize;     // blob radius ~0.75
uniform float uColorSpacing;  // ~0.52
uniform float uColorSpread;   // falloff ~4.5
uniform vec2  uColorOffset;
uniform float uColorRotation; // radians
uniform float uDisplacement;  // ~5.0
uniform float uSpacing;       // noise frequency ~4.3
uniform float uZoom;          // ~0.72
uniform float uSeed;
uniform float uNoiseSize;     // grain scale
uniform float uNoiseIntensity;// ~0.06

/* --- 2D simplex noise (Ashima / IQ derivative, inlined) --- */
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec2 rot(vec2 p, float a){
  float c = cos(a), s = sin(a);
  return vec2(c*p.x - s*p.y, s*p.x + c*p.y);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - 0.5);
  p.x *= uRes.x / uRes.y;
  p /= uZoom * uScale;
  p += uTransform;

  /* domain warp, applied twice — first noise feeds the second lookup */
  float n1 = snoise(p * uSpacing * 0.25 + uSeed + uTime * 0.05);
  vec2 w1 = p + uDisplacement * 0.14 * vec2(n1, snoise(p * uSpacing * 0.25 - uSeed - uTime * 0.04));
  float n2 = snoise(w1 * uSpacing * 0.55 - uSeed * 2.0 + uTime * 0.03);
  vec2 w = w1 + uDisplacement * 0.10 * vec2(n2, n1);

  /* four colour blobs on a rotated cross, blended by smooth inverse distance */
  vec2 q = rot(w - uColorOffset, uColorRotation);
  vec2 s0 = vec2(-uColorSpacing, 0.0);
  vec2 s1 = vec2( uColorSpacing, 0.0);
  vec2 s2 = vec2(0.0, -uColorSpacing);
  vec2 s3 = vec2(0.0,  uColorSpacing);

  float d0 = smoothstep(uColorSize, 0.0, pow(length(q - s0), 1.0) ) ;
  float d1 = smoothstep(uColorSize, 0.0, length(q - s1));
  float d2 = smoothstep(uColorSize, 0.0, length(q - s2));
  float d3 = smoothstep(uColorSize, 0.0, length(q - s3));

  /* spread sharpens the falloff — the black between the light */
  d0 = pow(d0, uColorSpread * 0.25);
  d1 = pow(d1, uColorSpread * 0.25);
  d2 = pow(d2, uColorSpread * 0.25);
  d3 = pow(d3, uColorSpread * 0.25);

  vec3 col = vec3(0.0);
  col = mix(col, uC0, d0);
  col = mix(col, uC1, d1);
  col = mix(col, uC2, d2);
  col = mix(col, uC3, d3);

  /* film grain, also dithers the dark falloff */
  float g = hash(gl_FragCoord.xy * uNoiseSize + fract(uTime) * 61.7);
  col += (g - 0.5) * uNoiseIntensity;

  fragColor = vec4(col * uOpacity, 1.0);
}`;

export type Palette = [string, string, string, string];

const hex2rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export const PALETTES: Record<string, Palette> = {
  home: ["#16254b", "#23418a", "#aadfd9", "#e64f0f"]
};

class GradientApp {
  private gl: WebGL2RenderingContext | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private t0 = 0;
  private running = false;
  private reduced = false;
  private canvas: HTMLCanvasElement | null = null;

  /* tweenable state */
  state = {
    opacity: 0,
    scale: 1.06,
    tx: 0,
    ty: 0,
    colorSize: 0.75,
    colorSpacing: 0.52,
    colorSpread: 4.5,
    colorRotation: 0.6,
    displacement: 3.6,
    spacing: 2.6,
    zoom: 0.62,
    seed: 7.31,
    noiseSize: 1.0,
    noiseIntensity: 0.06,
    c0: hex2rgb(PALETTES.home[0]),
    c1: hex2rgb(PALETTES.home[1]),
    c2: hex2rgb(PALETTES.home[2]),
    c3: hex2rgb(PALETTES.home[3])
  };

  ok = false;

  mount(canvas: HTMLCanvasElement, reduced: boolean) {
    if (this.gl) return; // singleton — never remount
    this.canvas = canvas;
    this.reduced = reduced;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) return;
    this.gl = gl;

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT);
    const fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    [
      "uRes", "uTime", "uTransform", "uOpacity", "uScale",
      "uC0", "uC1", "uC2", "uC3",
      "uColorSize", "uColorSpacing", "uColorSpread", "uColorOffset", "uColorRotation",
      "uDisplacement", "uSpacing", "uZoom", "uSeed", "uNoiseSize", "uNoiseIntensity"
    ].forEach(n => { this.u[n] = gl.getUniformLocation(prog, n); });

    this.resize();
    addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", () => {
      document.hidden ? this.stop() : this.start();
    });

    this.ok = true;
    this.t0 = performance.now();
    this.start();
  }

  private resize = () => {
    if (!this.gl || !this.canvas) return;
    /* DPR capped at 1 — grain stays coarse, fill-rate stays cheap */
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;
    this.canvas.style.width = innerWidth + "px";
    this.canvas.style.height = innerHeight + "px";
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  };

  private frame = (now: number) => {
    if (!this.running) return;
    const gl = this.gl!;
    const s = this.state;
    const t = this.reduced ? 12.0 : (now - this.t0) / 1000;
    gl.uniform2f(this.u.uRes, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.u.uTime, t);
    gl.uniform2f(this.u.uTransform, s.tx, s.ty);
    gl.uniform1f(this.u.uOpacity, s.opacity);
    gl.uniform1f(this.u.uScale, s.scale);
    gl.uniform3fv(this.u.uC0, s.c0);
    gl.uniform3fv(this.u.uC1, s.c1);
    gl.uniform3fv(this.u.uC2, s.c2);
    gl.uniform3fv(this.u.uC3, s.c3);
    gl.uniform1f(this.u.uColorSize, s.colorSize);
    gl.uniform1f(this.u.uColorSpacing, s.colorSpacing);
    gl.uniform1f(this.u.uColorSpread, s.colorSpread);
    gl.uniform2f(this.u.uColorOffset, 0, 0);
    gl.uniform1f(this.u.uColorRotation, s.colorRotation);
    gl.uniform1f(this.u.uDisplacement, s.displacement);
    gl.uniform1f(this.u.uSpacing, s.spacing);
    gl.uniform1f(this.u.uZoom, s.zoom);
    gl.uniform1f(this.u.uSeed, s.seed);
    gl.uniform1f(this.u.uNoiseSize, s.noiseSize);
    gl.uniform1f(this.u.uNoiseIntensity, s.noiseIntensity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.raf = requestAnimationFrame(this.frame);
  };

  start() {
    if (this.running || !this.gl) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.frame);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** bloom in after preload */
  bloom() {
    gsap.to(this.state, { opacity: 1, scale: 1, duration: 1.4, ease: "expo.out" });
  }

  /** GSAP-tween the four colours to a new palette */
  setPalette(p: Palette, duration = 1.1) {
    const [a, b, c, d] = p.map(hex2rgb);
    const s = this.state;
    gsap.to(s.c0, { 0: a[0], 1: a[1], 2: a[2], duration, ease: "power2.inOut" });
    gsap.to(s.c1, { 0: b[0], 1: b[1], 2: b[2], duration, ease: "power2.inOut" });
    gsap.to(s.c2, { 0: c[0], 1: c[1], 2: c[2], duration, ease: "power2.inOut" });
    gsap.to(s.c3, { 0: d[0], 1: d[1], 2: d[2], duration, ease: "power2.inOut" });
  }

  /** scroll progress drives the ribbon's travel */
  setScroll(progress: number) {
    this.state.tx = progress * 0.9;
    this.state.ty = progress * 0.55;
  }
}

export const gradient = new GradientApp();
