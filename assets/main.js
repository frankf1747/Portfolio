/* Frank Fu — portfolio draft 1
   Rules encoded here:
   - scrub everything to scroll (0.8), pin nothing
   - flash is timed + skippable + once per session, never scroll-driven
   - cursor carries useful labels
   - reduced motion disables the lot
*/

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Entry flash ---------- */
(function flash() {
  const el = document.getElementById("flash");
  if (!el || reduced || sessionStorage.getItem("flashSeen")) { el && el.remove(); return; }

  const screens = [...el.querySelectorAll(".flash-screen")];
  const STEP = 480; // ms per screen — total ~1.9s
  let i = 0, timer = null, done = false;

  const show = (n) => {
    screens.forEach((s, j) => {
      s.classList.toggle("show", j === n);
      if (j === n) { s.style.background = s.dataset.bg; s.style.color = s.dataset.fg; }
    });
  };

  const end = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    sessionStorage.setItem("flashSeen", "1");
    el.remove();
    ["click", "keydown", "wheel", "touchstart"].forEach(t => window.removeEventListener(t, end));
  };

  const next = () => {
    if (i >= screens.length) return end();
    show(i++);
    timer = setTimeout(next, STEP);
  };

  ["click", "keydown", "wheel", "touchstart"].forEach(t =>
    window.addEventListener(t, end, { passive: true }));

  el.classList.add("on");
  next();
})();

/* ---------- Lenis smooth scroll ---------- */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new Lenis({ lerp: 0.12 });
  window.lenis = lenis; // debuggable + rail links below
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* Rail anchors must go through Lenis, or it fights the native jump */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.1 });
    else target.scrollIntoView({ behavior: "smooth" });
  });
});

/* ---------- GSAP: scrub everything, pin nothing ---------- */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on("scroll", ScrollTrigger.update);

  /* Rail progress */
  gsap.to(".rail-fill", {
    scaleY: 1,
    ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.8 }
  });

  if (!reduced) {
    /* Hero title drifts up slightly as you leave it */
    gsap.to(".hero-title", {
      yPercent: -14, ease: "none",
      scrollTrigger: { trigger: ".band-hero", start: "top top", end: "bottom top", scrub: 0.8 }
    });

    /* Focus items slide in, tied to their own scroll window */
    document.querySelectorAll(".focus-item").forEach(item => {
      gsap.fromTo(item, { opacity: 0, x: -48 }, {
        opacity: 1, x: 0, ease: "none",
        scrollTrigger: { trigger: item, start: "top 92%", end: "top 55%", scrub: 0.8 }
      });
    });

    /* Work cards rise; media gets a slight counter-parallax */
    document.querySelectorAll(".work-card").forEach(card => {
      gsap.fromTo(card, { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: card, start: "top 94%", end: "top 58%", scrub: 0.8 }
      });
      const media = card.querySelector(".work-media");
      if (media) gsap.fromTo(media, { y: 24 }, {
        y: -24, ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.8 }
      });
    });

    gsap.fromTo(".colophon", { opacity: 0 }, {
      opacity: 0.6, ease: "none",
      scrollTrigger: { trigger: ".colophon", start: "top 95%", end: "top 70%", scrub: 0.8 }
    });
  } else {
    gsap.set(".focus-item, .work-card, .colophon", { opacity: 1 });
  }
}

/* ---------- Pointer-reactive hero blobs ---------- */
if (!reduced) {
  const blobA = document.querySelector(".blob-a");
  const blobB = document.querySelector(".blob-b");
  let tx = 0, ty = 0, cx = 0, cy = 0;
  window.addEventListener("pointermove", (e) => {
    tx = (e.clientX / innerWidth - 0.5);
    ty = (e.clientY / innerHeight - 0.5);
  }, { passive: true });
  const drift = () => {
    cx += (tx - cx) * 0.045;
    cy += (ty - cy) * 0.045;
    if (blobA) blobA.style.transform = `translate(${cx * 70}px, ${cy * 50}px)`;
    if (blobB) blobB.style.transform = `translate(${cx * -50}px, ${cy * -70}px)`;
    requestAnimationFrame(drift);
  };
  drift();
}

/* ---------- Custom cursor label ---------- */
(function cursor() {
  const c = document.getElementById("cursor");
  const label = document.getElementById("cursor-label");
  if (!c || !label || matchMedia("(pointer: coarse)").matches) { c && c.remove(); return; }

  let x = -100, y = -100, rx = -100, ry = -100;
  window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  const follow = () => {
    rx += (x - rx) * 0.22;
    ry += (y - ry) * 0.22;
    c.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  };
  follow();

  document.querySelectorAll("[data-cursor]").forEach(el => {
    el.addEventListener("pointerenter", () => {
      label.textContent = el.dataset.cursor;
      c.classList.add("active");
    });
    el.addEventListener("pointerleave", () => c.classList.remove("active"));
  });
})();

/* ---------- Copy email ---------- */
(function copyEmail() {
  const btn = document.getElementById("copy-email");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.textContent.trim());
      const prev = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(() => { btn.textContent = prev; }, 1400);
    } catch (_) { /* clipboard unavailable — leave text selectable */ }
  });
})();
