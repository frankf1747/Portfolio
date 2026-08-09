/* Frank Fu — portfolio draft 2
   One WebGL gradient field persists across routes; its lower edge tracks
   the current view's hero, so home→work is a morph, not a page swap.
   Content is visible at rest — scroll drives transforms, never visibility.
*/

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ================= Shader field ================= */
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_cover;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.55;
  for(int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.05 + 11.3; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 0.045;

  /* cursor pulls the field toward itself */
  vec2 m = u_mouse; m.x *= u_res.x / u_res.y;
  float md = length(p - m);
  p += (m - p) * 0.35 * exp(-md * 2.2);

  /* domain-warped fbm — the plasma */
  vec2 q = vec2(fbm(p * 1.15 + vec2(t, -t * 0.7)), fbm(p * 1.15 + vec2(-t * 0.6, t)));
  float f = fbm(p * 1.35 + 1.8 * q + vec2(t * 0.5, -t * 0.3));

  vec3 deep   = vec3(0.020, 0.024, 0.040);
  vec3 blue   = vec3(0.043, 0.310, 0.847);
  vec3 cyan   = vec3(0.180, 0.545, 0.941);
  vec3 redor  = vec3(0.910, 0.271, 0.122);
  vec3 orange = vec3(0.961, 0.518, 0.165);

  vec3 col = deep;
  col = mix(col, blue,   smoothstep(0.28, 0.46, f));
  col = mix(col, cyan,   smoothstep(0.46, 0.58, f));
  col = mix(col, redor,  smoothstep(0.58, 0.74, f));
  col = mix(col, orange, smoothstep(0.74, 0.88, f));
  /* keep big black pockets — monopo's darkness lives between the colour */
  col *= smoothstep(0.06, 0.30, f) * 0.92 + 0.08;

  /* in-shader grain */
  float g = hash(gl_FragCoord.xy + fract(u_time) * 61.7);
  col += (g - 0.5) * 0.085;

  /* lower edge: gradient covers top u_cover of viewport, wavy boundary */
  float yTop = 1.0 - uv.y;
  float wave = 0.05 * sin(uv.x * 4.2 + u_time * 0.35) * smoothstep(0.0, 0.2, 1.0 - u_cover);
  float edge = u_cover + wave;
  float alpha = 1.0 - smoothstep(edge - 0.015, edge + 0.015, yTop);

  gl_FragColor = vec4(col * alpha, alpha);
}`;

const field = (() => {
  const canvas = document.getElementById("field");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
  if (!gl) { canvas.remove(); return null; }

  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }");
  gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, FRAG);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fs));
    canvas.remove(); return null;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { res: U("u_res"), time: U("u_time"), mouse: U("u_mouse"), cover: U("u_cover") };

  const DPR = Math.min(devicePixelRatio || 1, 1.75);
  const size = () => {
    canvas.width = innerWidth * DPR;
    canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  size();
  addEventListener("resize", size);

  /* state lerped every frame → everything is a continuous mapping */
  const st = { mx: 0.5, my: 0.5, tmx: 0.5, tmy: 0.5, cover: 1.0, coverTarget: 1.0 };
  addEventListener("pointermove", (e) => {
    st.tmx = e.clientX / innerWidth;
    st.tmy = 1.0 - e.clientY / innerHeight;
  }, { passive: true });

  let t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    st.mx += (st.tmx - st.mx) * 0.05;
    st.my += (st.tmy - st.my) * 0.05;
    st.cover += (st.coverTarget - st.cover) * 0.09;
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, reduced ? 0 : t);
    gl.uniform2f(u.mouse, st.mx, st.my);
    gl.uniform1f(u.cover, st.cover);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return st;
})();

/* Cover follows the active hero's bottom edge — scrubbed by construction */
let heroEl = document.querySelector('[data-view="home"] .hero');
const trackCover = () => {
  if (field && heroEl) {
    const b = heroEl.getBoundingClientRect().bottom;
    field.coverTarget = Math.max(0, Math.min(1, b / innerHeight));
  }
  requestAnimationFrame(trackCover);
};
requestAnimationFrame(trackCover);

/* ================= Entry flash ================= */
(function flash() {
  const el = document.getElementById("flash");
  if (!el || reduced || sessionStorage.getItem("flashSeen")) { el && el.remove(); return; }
  const screens = [...el.querySelectorAll(".flash-screen")];
  const STEP = 480;
  let i = 0, timer = null, done = false;
  const show = (n) => screens.forEach((s, j) => {
    s.classList.toggle("show", j === n);
    if (j === n) { s.style.background = s.dataset.bg; s.style.color = s.dataset.fg; }
  });
  const end = () => {
    if (done) return;
    done = true; clearTimeout(timer);
    sessionStorage.setItem("flashSeen", "1");
    el.remove();
    ["click", "keydown", "wheel", "touchstart"].forEach(t => removeEventListener(t, end));
  };
  const next = () => { if (i >= screens.length) return end(); show(i++); timer = setTimeout(next, STEP); };
  ["click", "keydown", "wheel", "touchstart"].forEach(t => addEventListener(t, end, { passive: true }));
  el.classList.add("on");
  next();
})();

/* ================= Lenis ================= */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new Lenis({ lerp: 0.16 });
  window.lenis = lenis;
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* ================= Router ================= */
const views = {
  home: document.querySelector('[data-view="home"]'),
  work: document.querySelector('[data-view="work"]')
};
let current = "home";

function setActiveNav(name) {
  document.querySelectorAll(".nav-link").forEach(a =>
    a.classList.toggle("is-active", a.dataset.route === name));
}

function goTo(name, animate = true) {
  if (!views[name] || name === current) return;
  const out = views[current], inn = views[name];
  current = name;
  setActiveNav(name);

  const swap = () => {
    out.hidden = true;
    inn.hidden = false;
    heroEl = inn.querySelector(".hero, .work-hero");
    if (lenis) lenis.scrollTo(0, { immediate: true }); else scrollTo(0, 0);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };

  if (!animate || reduced || !window.gsap) { swap(); return; }
  gsap.to(out, {
    opacity: 0, y: -24, duration: 0.3, ease: "power2.in",
    onComplete: () => {
      swap();
      gsap.fromTo(inn, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.5, ease: "power2.out",
        onComplete: () => gsap.set(inn, { clearProps: "all" })
      });
      gsap.set(out, { clearProps: "all" });
    }
  });
}

function route() {
  goTo(location.hash === "#/work" ? "work" : "home");
}
addEventListener("hashchange", route);
route();

/* ================= Scroll transforms (visible at rest, scrub moves) ================= */
if (window.gsap && window.ScrollTrigger && !reduced) {
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on("scroll", ScrollTrigger.update);

  gsap.to(".hero-title", {
    yPercent: -10, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 }
  });

  document.querySelectorAll(".recent-row").forEach((row, i) => {
    gsap.fromTo(row, { x: i % 2 ? 30 : -30 }, {
      x: 0, ease: "none",
      scrollTrigger: { trigger: row, start: "top bottom", end: "top 60%", scrub: 0.8 }
    });
  });

  document.querySelectorAll(".card").forEach(card => {
    const media = card.querySelector(".card-media");
    if (media) gsap.fromTo(media, { y: 18 }, {
      y: -18, ease: "none",
      scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.8 }
    });
  });
}

/* ================= Work filter ================= */
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const f = btn.dataset.filter;
    document.querySelectorAll(".card").forEach(card => {
      const show = f === "all" || card.dataset.cat === f;
      if (window.gsap && !reduced) {
        if (show && card.style.display === "none") {
          card.style.display = "";
          gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35 });
        } else if (!show) {
          gsap.to(card, { opacity: 0, y: 12, duration: 0.22, onComplete: () => { card.style.display = "none"; } });
        }
      } else {
        card.style.display = show ? "" : "none";
      }
    });
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 420);
  });
});

/* ================= Cursor ================= */
(function cursor() {
  const c = document.getElementById("cursor");
  const label = document.getElementById("cursor-label");
  if (!c || !label || matchMedia("(pointer: coarse)").matches) { c && c.remove(); return; }
  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  const follow = () => {
    rx += (x - rx) * 0.22; ry += (y - ry) * 0.22;
    c.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  };
  follow();
  document.querySelectorAll("[data-cursor]").forEach(el => {
    el.addEventListener("pointerenter", () => { label.textContent = el.dataset.cursor; c.classList.add("active"); });
    el.addEventListener("pointerleave", () => c.classList.remove("active"));
  });
})();

/* ================= Copy email ================= */
document.querySelectorAll("#copy-email, .js-copy").forEach(btn => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("frankfu1747@gmail.com");
      const prev = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(() => { btn.textContent = prev; }, 1400);
    } catch (_) {}
  });
});

/* ================= LA clock ================= */
(function clock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles" });
  const tick = () => { el.textContent = "LA " + fmt.format(new Date()); };
  tick();
  setInterval(tick, 30000);
})();
