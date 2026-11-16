// 03 Scrapbook. Reads window.PLAN (goat.mjs writes it; look.mjs works out when each card, sticker and word comes and
// goes) and builds one paused GSAP timeline. The photo cards and the stickers are in index.html already (look.mjs
// writes them there, as HyperFrames needs); the words are made here.
const P = window.PLAN, T = P.T, D = P.dur;
const tl = gsap.timeline({ paused: true });
const EPS = 1e-6, F1 = 1 / 30;
const root = document.getElementById("root");
root.classList.add(P.paper, `f-${P.frame}`);
const print = P.frame === "print";

// The preview's four stop-motion poses (dx px, dy px, degrees). Each piece hops to another of them 8 times a second,
// all on the same beat, as an animator moves every paper piece between two shots. Words hop half as far, so they stay
// easy to read.
const POSES = [[0, 0, 0], [5, -4, 0.5], [-4, 3, -0.4], [3, 5, 0.3]];
const TAPES = ["#F4B6C2", "#A8D5BA", "#F9E79F"]; // pink, green, yellow washi (preview + v1)
// the pile: two slots in turn, the card under the top one leaning another way and set off a little, so it peeks out.
// The Polaroid leans -6° / -3° (preview + v1); the taller print -4° / -2°, so it fits between the title and the note.
const SLOT = print ? [{ x: 0, y: 0, rotation: -4 }, { x: 22, y: 8, rotation: -2 }] : [{ x: 0, y: 0, rotation: -6 }, { x: 22, y: 8, rotation: -3 }];
const STICK = { right: 1042, top: 707, pad: 60 }; // the sticker picture's right edge and top (its rim reaches 1058, 691)

function jitter(el, from, to, seed, amp = 1) {
  const rng = GOAT.rng(seed);
  let last = 0;
  for (let k = Math.max(0, Math.ceil(from / T.STEP - EPS)); k * T.STEP < to - EPS; k++) {
    let p = last;
    while (p === last) p = Math.floor(rng() * POSES.length); // always a different pose, so every beat is a hop
    last = p;
    const [x, y, r] = POSES[p];
    tl.set(el, { x: x * amp, y: y * amp, rotation: r * amp }, k * T.STEP);
  }
}

// A piece lands in 7 frames: 70% -> 104% -> 100%, opaque within its first third, settling from 5° more lean (v1). It is
// already a seventh of the way in on its first frame, so a new card never leaves the page empty for a frame.
function popIn(el, at) {
  const t0 = at - F1;
  gsap.set(el, { opacity: 0, scale: 0.7, rotation: 5 });
  tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: T.POP / 3, ease: "none", immediateRender: false }, t0);
  tl.fromTo(el, { scale: 0.7 }, { scale: 1.04, duration: T.POP * 0.6, ease: "power2.out", immediateRender: false }, t0);
  tl.fromTo(el, { scale: 1.04 }, { scale: 1, duration: T.POP * 0.4, ease: "power1.inOut", immediateRender: false }, t0 + T.POP * 0.6);
  tl.fromTo(el, { rotation: 5 }, { rotation: 0, duration: T.POP, ease: "power2.out", immediateRender: false }, t0);
}
// ... and goes with a quick 0.15 s fade, shrinking to 92% (v1)
function popOut(el, at) {
  tl.fromTo(el, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.92, duration: T.OUT, ease: "power1.in", immediateRender: false }, at - T.OUT);
}
// a piece: shown as is when it is there on frame 0, else popping in; going (unless it stays); hopping while it shows
function piece(el, it, seed, amp = 1) {
  const pop = el.firstElementChild, jit = pop.firstElementChild;
  if (it.start < EPS) gsap.set(pop, { opacity: 1, scale: 1, rotation: 0 });
  else popIn(pop, it.start);
  if (!it.stays) popOut(pop, it.end);
  jitter(jit, Math.max(0, it.start - F1), it.end, seed, amp);
  return jit;
}
function shell(cls, parent) {
  const el = parent.appendChild(document.createElement("div"));
  el.className = cls;
  const jit = el.appendChild(document.createElement("div")).appendChild(document.createElement("div"));
  jit.parentElement.className = "pop";
  jit.className = "jit";
  return el;
}

// The photo cards: each lands on the pile as its clip starts (the first is there on frame 0) and goes once the card
// two later has landed on it. Tape colours turn with the cards.
for (const c of P.cards) {
  const el = document.getElementById(`card-${c.i}`);
  el.style.zIndex = String(c.i + 1);
  gsap.set(el, SLOT[c.slot]);
  el.querySelectorAll(".tape").forEach((t, k) => { t.style.backgroundColor = TAPES[(c.i + k) % TAPES.length]; });
  piece(el, { start: c.land, end: c.until, stays: true }, 3000 + c.i);
  if (c.until < D - EPS) tl.set(el, { visibility: "hidden" }, c.until);
}

// The lower page fills up: once a card is covered on the pile, a small copy of it (its clip's last frame) pops onto the
// page below, at the next of a few spots (seeded a little off each time), the newest on top. Below the safe box, so
// app text may cover it: it is decoration, never words. They hop half as far as the pieces in play.
const SPOTS = [[70, 1300, -9], [310, 1350, 6], [150, 1530, 4], [430, 1560, -7], [40, 1700, -4], [270, 1720, 8], [520, 1420, -3]];
P.cards.filter((c) => c.until < D - EPS).forEach((c, n) => {
  const el = document.getElementById(`mini-${c.i}`), rng = GOAT.rng(6000 + c.i), [x, y, r] = SPOTS[n % SPOTS.length];
  el.style.left = `${x + (rng() - 0.5) * 40}px`;
  el.style.top = `${y + (rng() - 0.5) * 40}px`;
  el.style.zIndex = String(n + 1);
  el.querySelector(".mpola").style.setProperty("--tape", TAPES[(c.i + 2) % TAPES.length]);
  gsap.set(el, { rotation: r + (rng() - 0.5) * 4 });
  piece(el, { start: c.until, end: D, stays: true }, 6000 + c.i, 0.5); // settled: they hop half as far
});

// Captions on the cards: one that comes with its card is simply there; one that starts later writes itself on, left to
// right; one that ends while its card is on top fades.
const capSpans = [];
for (const cp of P.captions) {
  const holder = document.getElementById(`card-${cp.card}`).querySelector(".cap");
  const span = holder.appendChild(document.createElement("span"));
  span.textContent = cp.text;
  gsap.set(span, { xPercent: -50, ...(print ? { rotation: -2 } : {}) });
  if (cp.write) {
    gsap.set(span, { clipPath: "inset(-20% 100% -20% 0%)" });
    tl.fromTo(span, { clipPath: "inset(-20% 100% -20% 0%)" }, { clipPath: "inset(-20% 0% -20% 0%)", duration: T.WRITE,
      ease: "power1.inOut", immediateRender: false }, cp.from);
    tl.set(span, { clipPath: "none" }, cp.from + T.WRITE); // no clip-path left lying about (see look.css)
  }
  if (cp.leave) tl.fromTo(span, { opacity: 1 }, { opacity: 0, duration: T.OUT, ease: "power1.in", immediateRender: false }, cp.to - T.OUT);
  capSpans.push({ span });
}

// The stickers: the picture's right edge and top as in the preview, leaning 4° / -3° in turn.
for (const s of P.stickers) {
  const el = document.getElementById(`sticker-${s.k}`);
  el.style.left = `${STICK.right - s.w - STICK.pad}px`;
  el.style.top = `${STICK.top - STICK.pad}px`;
  gsap.set(el, { rotation: s.tilt });
  piece(el, s, 4000 + s.k);
}

// The words: the title, the price circle and the notes (one of each at a time).
const words = P.items.map((it, n) => {
  const el = shell(it.role, document.getElementById(it.role === "title" ? "titles" : it.role === "price" ? "prices" : "notes"));
  const jit = el.querySelector(".jit");
  if (it.role === "price") {
    const disc = jit.appendChild(document.createElement("div"));
    disc.className = "disc";
    for (const r of it.rows) disc.appendChild(document.createElement("div")).textContent = r;
    gsap.set(el, { rotation: 9 });
  } else {
    jit.textContent = it.text;
    gsap.set(el, { rotation: it.role === "title" ? -4 : -3 });
  }
  piece(el, it, 5000 + n, it.role === "price" ? 1 : 0.5);
  return { it, el };
});

tl.set({}, {}, D);
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;

// Sizes need the real fonts; the renderer waits for document.fonts.ready before the first frame. Each word fits its
// room, down to the floors look.mjs's row limits are measured at (title 64 px, caption 38, note 44, price 32).
// Rubik Marker Hatch at line-height 1: its capitals start 0.1425 em below the box top. The title's top is set so its
// capitals stay inside the safe box (from y 282) even at the raised right end of its -4° lean (0.035 x its width).
// Caveat at line-height 1: the baseline is 0.83 em below the box top; the note's baseline sits on y 1200, so its tails
// stay inside the safe box (y 1248) even at the lowered left end of its -3° lean. The note is written on a torn strip of
// ruled paper (look.css), 28 px wider each side than the words and 14 px taller, so it reads over a sticker too.
function layout() {
  for (const { it, el } of words) {
    if (it.role === "title") {
      const s = GOAT.fit(el, 840, 170, 64);
      el.style.top = `${282 - 0.1425 * s + 0.035 * el.offsetWidth}px`;
    } else if (it.role === "note") {
      const s = GOAT.fit(el, 840 + 56, 72, 44);
      el.style.top = `${1200 - 0.83 * s - 14}px`;
    } else {
      const rows = [...el.querySelectorAll(".disc div")];
      const s = Math.min(...rows.map((r) => GOAT.fit(r, 224, rows.length > 1 ? 50 : 56, 32)));
      rows.forEach((r) => { r.style.fontSize = `${s}px`; });
    }
  }
  // captions: centred on the strip's 56 px line (Polaroid), or on their own 58 px tape label (print: 22 px each side)
  for (const { span } of capSpans) {
    if (print) span.style.paddingTop = `${(58 - GOAT.fit(span, 460 + 44, 44, 38)) / 2}px`;
    else span.style.top = `${25 + (56 - GOAT.fit(span, 460, 56, 38)) / 2}px`;
  }
}
layout();
document.fonts.ready.then(layout);
