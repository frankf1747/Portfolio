/* Recent Work filmstrip.

   ONE fixed full-viewport canvas, ONE mesh, ONE atlas texture holding every
   project image stacked vertically. The DOM only supplies a bounding rect;
   the plane is synced to that rect via uniforms + scissor each frame — no
   canvas per project, no layout writes.

   The transition is a filmstrip scrolling upward through a fixed window:
   the slot index is floor()'d, so the boundary between two images is a HARD
   horizontal edge with no blend. Within its slot each image drifts at ~0.5x
   the strip speed, which is what makes it read as a window rather than a list. */

const VERT = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2      uRes;       // canvas px
uniform vec4      uRect;      // window x, y, w, h in px (y from top)
uniform float     uProgress;  // 0..1 across the whole section
uniform float     uCount;     // N projects
uniform float     uVelocity;  // scroll velocity, settles to 0
uniform sampler2D uAtlas;

const float ZOOM = 1.20;      // headroom so parallax never samples off-image
const float PAR  = 0.085;     // ~0.5x drift within the slot

void main(){
  float px = gl_FragCoord.x;
  float py = uRes.y - gl_FragCoord.y;              // top-left origin
  vec2 local = vec2((px - uRect.x) / uRect.z, (py - uRect.y) / uRect.w);
  if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) discard;

  float N = uCount;
  float d = uProgress * (N - 1.0);

  /* which slot this fragment falls in — floor() is the hard edge */
  float yStrip = local.y + d;
  float slot   = clamp(floor(yStrip), 0.0, N - 1.0);
  float f      = clamp(yStrip - slot, 0.0, 1.0);
  float phase  = d - slot;                          // slot's travel through the window

  float texV = (f - 0.5) / ZOOM + 0.5 + phase * PAR;
  float texU = (local.x - 0.5) / ZOOM + 0.5;

  /* velocity: slight vertical stretch + shear while flinging, 0 at rest */
  texV  = (texV - 0.5) * (1.0 + abs(uVelocity) * 0.22) + 0.5;
  texU += uVelocity * 0.018 * (local.y - 0.5);

  texU = clamp(texU, 0.002, 0.998);
  texV = clamp(texV, 0.002, 0.998);

  float atlasV = (slot + texV) / N;
  fragColor = vec4(texture(uAtlas, vec2(texU, atlasV)).rgb, 1.0);
}`;

const TW = 1024;            // atlas cell width
const TH = 640;             // 16:10

/** Abstract composition per palette — stands in until real 16:10 art exists.
    Swap by setting `image` on the project; loadAtlas prefers it. */
function paintCell(ctx: CanvasRenderingContext2D, y: number, palette: string[], seed: number) {
  const [deep, warm, cool, hot] = palette;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, TW, TH);
  ctx.clip();

  ctx.fillStyle = deep;
  ctx.fillRect(0, y, TW, TH);

  const rnd = (n: number) => {
    const x = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // broad sweeps
  for (let i = 0; i < 5; i++) {
    const g = ctx.createLinearGradient(
      rnd(i) * TW, y + rnd(i + 9) * TH,
      rnd(i + 3) * TW, y + rnd(i + 17) * TH
    );
    const c = [warm, cool, hot, warm, cool][i];
    g.addColorStop(0, c + "00");
    g.addColorStop(0.45, c + "cc");
    g.addColorStop(1, c + "00");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, TW, TH);
  }

  // a horizontal band of light — echoes the background ribbon
  const band = ctx.createLinearGradient(0, y + TH * 0.38, 0, y + TH * 0.72);
  band.addColorStop(0, hot + "00");
  band.addColorStop(0.5, hot + "aa");
  band.addColorStop(1, hot + "00");
  ctx.fillStyle = band;
  ctx.fillRect(0, y, TW, TH);

  // grain
  const img = ctx.getImageData(0, y, TW, TH);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    px[i] += n; px[i + 1] += n; px[i + 2] += n;
  }
  ctx.putImageData(img, 0, y);
  ctx.restore();
}

class Filmstrip {
  private gl: WebGL2RenderingContext | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private canvas: HTMLCanvasElement | null = null;
  private count = 0;
  ok = false;

  /** written by the section each frame */
  rect = { x: 0, y: 0, w: 0, h: 0 };
  progress = 0;
  velocity = 0;

  mount(canvas: HTMLCanvasElement, palettes: string[][], images: (string | undefined)[]) {
    if (this.gl) return;
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    this.gl = gl;
    this.count = palettes.length;

    const sh = (t: number, src: string) => {
      const s = gl.createShader(t)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    ["uRes", "uRect", "uProgress", "uCount", "uVelocity", "uAtlas"].forEach(n => {
      this.u[n] = gl.getUniformLocation(prog, n);
    });

    /* build the atlas: N cells stacked vertically in one texture */
    const atlas = document.createElement("canvas");
    atlas.width = TW; atlas.height = TH * this.count;
    const ctx = atlas.getContext("2d")!;
    palettes.forEach((p, i) => paintCell(ctx, i * TH, p, i + 1));

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);   // row 0 = v 0 = top
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(this.u.uAtlas, 0);

    /* real art, when supplied, replaces its cell and re-uploads */
    images.forEach((src, i) => {
      if (!src) return;
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.decoding = "async";
      im.onload = () => {
        ctx.drawImage(im, 0, i * TH, TW, TH);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      };
      im.src = src;
    });

    this.resize();
    addEventListener("resize", this.resize);
    this.ok = true;
  }

  private resize = () => {
    if (!this.gl || !this.canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(innerWidth * dpr);
    this.canvas.height = Math.round(innerHeight * dpr);
    this.canvas.style.width = innerWidth + "px";
    this.canvas.style.height = innerHeight + "px";
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  };

  /** called from the shared ticker; rect is in CSS px, top-left origin */
  render() {
    const gl = this.gl;
    if (!gl || !this.canvas) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (this.rect.w <= 0 || this.rect.h <= 0) return;

    const dpr = this.canvas.width / innerWidth;
    const x = this.rect.x * dpr, y = this.rect.y * dpr;
    const w = this.rect.w * dpr, h = this.rect.h * dpr;

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(Math.round(x), Math.round(this.canvas.height - y - h), Math.round(w), Math.round(h));
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform4f(this.u.uRect, x, y, w, h);
    gl.uniform1f(this.u.uProgress, this.progress);
    gl.uniform1f(this.u.uCount, this.count);
    gl.uniform1f(this.u.uVelocity, this.velocity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
  }
}

export const filmstrip = new Filmstrip();
