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
uniform vec2  uMouse;         // lerped pointer, 0..1 — the only animator
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
uniform float uRepel;         // how hard the pointer pushes the field away
uniform float uVoid;          // how dark the hollow around the pointer goes

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

  /* The pointer is the only animator: no clock anywhere in this shader.
     Two effects, both settling to a fixed frame when the pointer stops.
     1) travel — the pointer walks the noise domain, so the ribbon
        genuinely re-forms rather than sliding. */
  vec2 mo = (uMouse - 0.5) * 1.35;

  /* 2) AVOIDANCE — the colour mass slides away from the pointer as a whole.
        Deliberately NOT a radial push from the cursor: displacing along
        normalize(p - mouse) makes the field radiate out of the pointer,
        which reads as expanding from it rather than shying away. A single
        translation opposite the pointer is what "avoiding" looks like. */
  vec2 avoid = (uMouse - 0.5) * vec2(1.75, 0.85) * uRepel;

  /* Anisotropic domain — noise features stretch along X, so the whole
     field trends horizontally instead of blooming radially. */
  const vec2 ANISO = vec2(0.44, 1.9);

  /* domain warp, applied twice — first noise feeds the second lookup */
  vec2 pa = p * ANISO;
  float n1 = snoise(pa * uSpacing * 0.25 + uSeed + mo);
  vec2 w1 = p + uDisplacement * vec2(0.20, 0.075) * vec2(n1, snoise(pa * uSpacing * 0.25 - uSeed - mo * 0.8));
  float n2 = snoise(w1 * ANISO * uSpacing * 0.55 - uSeed * 2.0 + mo * 0.6);
  vec2 w = w1 + uDisplacement * vec2(0.15, 0.055) * vec2(n2, n1);

  /* four colour blobs strung out in a horizontal row, each a wide ellipse —
     the band reads as one long ribbon crossing the frame */
  vec2 q = rot(w - uColorOffset + avoid, uColorRotation);
  vec2 s0 = vec2(-1.62,  0.12) * uColorSpacing;
  vec2 s1 = vec2(-0.54, -0.17) * uColorSpacing;
  vec2 s2 = vec2( 0.54,  0.15) * uColorSpacing;
  vec2 s3 = vec2( 1.62, -0.11) * uColorSpacing;

  /* COVERAGE follows the pointer's horizontal position: at the left edge
     the field swells to flood the frame, at the right edge it retreats and
     black takes over. Centre sits near 1.0 — the resting look. */
  float cov = mix(1.52, 0.66, clamp(uMouse.x, 0.0, 1.0));

  /* wide + short, and unequal: the deep/warm pair carry the field, the
     cool and the acid yellow stay highlights rather than equal stripes */
  const vec2 ELL = vec2(0.58, 1.85);
  float d0 = smoothstep(uColorSize * 1.18 * cov, 0.0, length((q - s0) * ELL));
  float d1 = smoothstep(uColorSize * 1.02 * cov, 0.0, length((q - s1) * ELL));
  float d2 = smoothstep(uColorSize * 0.78 * cov, 0.0, length((q - s2) * ELL));
  float d3 = smoothstep(uColorSize * 0.50 * cov, 0.0, length((q - s3) * ELL));

  /* spread sharpens the falloff — the black between the light */
  d0 = pow(d0, uColorSpread * 0.25);
  d1 = pow(d1, uColorSpread * 0.25);
  d2 = pow(d2, uColorSpread * 0.25);
  d3 = pow(d3, uColorSpread * 0.25);

  /* Black base with the ribbon laid over it — the resting look. Coverage
     is what the pointer changes, not the base: no hollow is carved at the
     cursor, because a dark disc tracking the pointer reads as centred on
     it rather than avoiding it. */
  vec3 col = vec3(0.0);
  col = mix(col, uC0, d0);
  col = mix(col, uC1, d1);
  col = mix(col, uC2, d2);
  col = mix(col, uC3, d3);

  /* thin tails fall to true black — the darkness between the light */
  float cover = max(max(d0, d1), max(d2, d3));
  col *= smoothstep(0.015, 0.34, cover);

  /* film grain, also dithers the dark falloff — static, like real film */
  float g = hash(gl_FragCoord.xy * uNoiseSize);
  col += (g - 0.5) * uNoiseIntensity;

  fragColor = vec4(col * uOpacity, 1.0);
}`;

export type Palette = [string, string, string, string];

const hex2rgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/* Drawn from the ZZZ key art (crimson field, teal hair, cream) with the
   K-R4 card's acid yellow and sky blue as the highlight notes. */
export const PALETTES: Record<string, Palette> = {
  home: ["#8E1229", "#E8452F", "#35C9C0", "#F2E63C"],
  work: ["#0E2E3A", "#1E7F8C", "#4FC3F7", "#F2E8CE"],
  about: ["#2B0A2E", "#8E1229", "#F4623A", "#F2E63C"]
};

/** Each route owns a gradient mood; detail pages fall back to work. */
export function paletteForPath(path: string): Palette {
  if (path === "/") return PALETTES.home;
  if (path.startsWith("/about")) return PALETTES.about;
  return PALETTES.work;
}

class GradientApp {
  private gl: WebGL2RenderingContext | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private lastSig = "";
  private running = false;
  /** frames actually drawn — should stop climbing once the pointer settles */
  draws = 0;
  private reduced = false;
  private canvas: HTMLCanvasElement | null = null;

  /* tweenable state */
  state = {
    opacity: 0,
    scale: 1.06,
    tx: 0,
    ty: 0,
    /* lerped pointer (mx/my) chasing the raw target (tmx/tmy) */
    mx: 0.5,
    my: 0.5,
    tmx: 0.5,
    tmy: 0.5,
    colorSize: 0.92,       // resting size; the pointer's X scales it
    colorSpacing: 0.64,
    colorSpread: 4.6,       // sharp falloff — real black between the light
    repel: 1.0,             // avoidance strength (whole-field translation)
    void: 0.0,              // retired: a hollow at the cursor read as centred on it
    colorRotation: 0.07,   // near-flat: the band runs across, not diagonally
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
      "uRes", "uMouse", "uTransform", "uOpacity", "uScale",
      "uC0", "uC1", "uC2", "uC3",
      "uColorSize", "uColorSpacing", "uColorSpread", "uColorOffset", "uColorRotation",
      "uDisplacement", "uSpacing", "uZoom", "uSeed", "uNoiseSize", "uNoiseIntensity",
      "uRepel", "uVoid"
    ].forEach(n => { this.u[n] = gl.getUniformLocation(prog, n); });

    this.resize();
    addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", () => {
      document.hidden ? this.stop() : this.start();
    });

    /* pointer is the animator — ignored under reduced motion */
    if (!reduced) {
      addEventListener("pointermove", (e) => {
        this.state.tmx = e.clientX / innerWidth;
        this.state.tmy = 1 - e.clientY / innerHeight;
      }, { passive: true });
    }

    this.ok = true;
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
    this.invalidate();
  };

  private frame = () => {
    if (!this.running) return;
    const gl = this.gl!;
    const s = this.state;

    /* ease toward the pointer; when it stops, this converges and the
       signature below stops changing, so we stop drawing entirely */
    s.mx += (s.tmx - s.mx) * 0.055;
    s.my += (s.tmy - s.my) * 0.055;
    /* snap once imperceptibly close, so it truly stops instead of
       asymptotically crawling and redrawing forever */
    if (Math.abs(s.tmx - s.mx) < 2e-4) s.mx = s.tmx;
    if (Math.abs(s.tmy - s.my) < 2e-4) s.my = s.tmy;

    const sig =
      `${s.mx.toFixed(5)}|${s.my.toFixed(5)}|${s.tx.toFixed(4)}|${s.ty.toFixed(4)}` +
      `|${s.opacity.toFixed(4)}|${s.scale.toFixed(4)}` +
      `|${s.c0.join()}|${s.c1.join()}|${s.c2.join()}|${s.c3.join()}` +
      `|${gl.canvas.width}x${gl.canvas.height}`;
    if (sig === this.lastSig) {
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    this.lastSig = sig;

    gl.uniform2f(this.u.uRes, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(this.u.uMouse, s.mx, s.my);
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
    gl.uniform1f(this.u.uRepel, s.repel);
    gl.uniform1f(this.u.uVoid, s.void);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.draws++;
    this.raf = requestAnimationFrame(this.frame);
  };

  /** force the next frame to draw (resize, palette jump, bloom start) */
  invalidate() { this.lastSig = ""; }

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

  /** Route change: the field genuinely becomes a different gradient.
      Colours cross over while the seed and travel shift, so the ribbon
      re-forms rather than just re-tinting. Deliberately longer than the
      wipe panel, so part of the morph is visible on the way out and part
      on the way in. Interruptible — a second call retargets mid-flight. */
  morphTo(p: Palette, duration = 1.6) {
    this.setPalette(p, duration);
    gsap.to(this.state, {
      seed: this.state.seed + 3.1 + Math.random() * 2,
      duration,
      ease: "expo.inOut",
      overwrite: "auto"
    });
    gsap.fromTo(this.state,
      { scale: 1 },
      { scale: 1.05, duration: duration * 0.45, ease: "power2.out", yoyo: true, repeat: 1, overwrite: "auto" }
    );
  }

  /* Scroll-driven palette. `a`→`b` by `t` gives the colour of the strip
     position itself, so the background crosses on exactly the same value
     as the filmstrip; `from`/`amount` fades that in over the route's own
     palette as the section rises into view. Written directly, not tweened
     — the easing already lives in the scroll mapping. */
  drivePalette(from: Palette, a: Palette, b: Palette, t: number, amount: number) {
    const F = from.map(hex2rgb);
    const A = a.map(hex2rgb);
    const B = b.map(hex2rgb);
    const dst = [this.state.c0, this.state.c1, this.state.c2, this.state.c3];
    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 3; k++) {
        const ab = A[i][k] + (B[i][k] - A[i][k]) * t;
        dst[i][k] = F[i][k] + (ab - F[i][k]) * amount;
      }
    }
  }

  /** stop any route tween before scroll takes the wheel */
  releasePaletteTweens() {
    gsap.killTweensOf([this.state.c0, this.state.c1, this.state.c2, this.state.c3]);
  }

  /** scroll progress drives the ribbon's travel */
  setScroll(progress: number) {
    this.state.tx = progress * 0.9;
    this.state.ty = progress * 0.55;
  }
}

export const gradient = new GradientApp();

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __gradient: GradientApp }).__gradient = gradient;
}
