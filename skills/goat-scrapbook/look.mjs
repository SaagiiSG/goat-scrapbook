// 03 Scrapbook: a cream (or kraft) paper page. Each clip plays inside a taped Polaroid (or a print) that lands on a
// pile, the one before it still peeking out underneath. The member's photos become stickers with a thick white rim:
// die-cut round the subject when the photo has a transparent background, a printed rounded card when it doesn't. A
// marker title, a yellow price circle and handwritten notes. Pieces pop in (70 → 104 → 100% in 7 frames) and hop
// between 4 poses 8 times a second like stop-motion, while the footage inside the photos plays smoothly.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, rmSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { missing } from "./scripts/fonts.mjs";
import { probe, run, ffmpeg, photoPng } from "./scripts/media.mjs";

export const NAME = "scrapbook";
export const TALKS = false;
export const PER_CLIP = true;

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const FRAMES = { polaroid: [464, 464], print: [480, 600] }; // the photo inside the card (v1)
const GRADES = { true: "null", vintage: "curves=preset=vintage" }; // v1's
const PAPERS = ["cream", "kraft"];
const ROLES = ["title", "caption", "price", "note"];
const FONTS = {
  title: ["RubikMarkerHatch-Regular.ttf", "Rubik Marker Hatch"],
  caption: ["Caveat[wght].ttf", "Caveat"],
  price: ["Pangolin-Regular.ttf", "Pangolin"],
  note: ["Caveat[wght].ttf", "Caveat"],
};
// Row limits, from HarfBuzz advances of the bundled fonts at the floor sizes look.js fits down to, so a row of the
// widest letter a Mongolian keyboard types still fits its width: title 11 x 1.136 em (Ж, Rubik Marker Hatch) at 64 px =
// 800 px of 840; caption 14 x 0.853 em (Щ, Caveat 700) at 38 px = 454 px of 460; note 22 x 0.853 em at 44 px = 826 px of
// 840; price 7 x 0.89 em (Щ, Pangolin) at 32 px = 199 px of the circle's 224. Real words are much narrower: "өнөөдрийн
// засалт" is a 466 px note at the full 72 px, and a row of 7 digits and spaces is about 222 px, a price at the full 56 px.
const ROW = { title: 11, caption: 14, price: 7, note: 22 }, ROWS = { title: 1, caption: 1, price: 2, note: 1 };
// a sticker's picture at most (its 16 px white rim goes round it): die-cut as big as the preview's barber (594x960 with
// the rim, from y 691 down to 1651: a picture may hang below the safe box, the words never do), a printed one smaller,
// so its rectangle stays off the photo card
const BOX = { cutout: [562, 928], print: [400, 560] };
// seconds: a piece's pop (7 frames), its fade as it goes, its least time on screen, one jitter step (8 fps), the shortest
// tail of a caption carried onto the next card, a caption's write-on
const T = { POP: 7 / 30, OUT: 0.15, MIN: 1, STEP: 1 / 8, TAIL: 0.4, WRITE: 0.5 };
const EPS = 1e-9;

const isNum = (n) => typeof n === "number" && Number.isFinite(n);
const frame = (t) => (t === Infinity ? t : Math.round(t * 30) / 30); // the frame look.js shows it on
const s2 = (t) => t.toFixed(2);
const r3 = (t) => Math.round(t * 1000) / 1000;
const num = (t) => String(Math.round(t * 1e6) / 1e6);
const quote = (t) => `"${String(t.text ?? "").trim().replace(/\s*\n\s*/g, " / ")}"`;
const seconds = (dur) => {
  if (!(dur === Infinity || (isNum(dur) && dur > 0))) throw new Error("the video's length must be seconds");
};

function option(look, key, values, def) {
  const v = look?.[key] ?? def;
  if (!values.includes(v)) throw new Error(`look ${key} must be ${values.map((x) => `"${x}"`).join(" or ")}`);
  return v;
}
const frameOf = (plan) => option(plan.look, "frame", Object.keys(FRAMES), "polaroid");
const gradeOf = (plan) => option(plan.look, "grade", Object.keys(GRADES), "true");
const paperOf = (plan) => option(plan.look, "paper", PAPERS, "cream");
export const FIT = (plan) => FRAMES[frameOf(plan)];

// Saagii's answer 1 ("just have them put in the photo"): a photo whose pixel format has alpha is a die-cut sticker,
// unless it is opaque all over (`clear`, the share of see-through pixels, under 1%: a screenshot saved as RGBA). Any
// other photo is a printed sticker. pal8 (a palette PNG) may carry transparency, so it counts as alpha too.
const ALPHA = /^(yuva|gbrap|ya\d|rgba|bgra|argb|abgr|pal8)/;
export function stickerMode(info) {
  if (typeof info?.pix_fmt !== "string" || !info.pix_fmt) throw new Error("stickerMode needs the photo's pixel format (pix_fmt)");
  if (info.clear !== undefined && !(isNum(info.clear) && info.clear >= 0 && info.clear <= 1))
    throw new Error("stickerMode: clear must be a share of the picture, 0 to 1");
  if (!ALPHA.test(info.pix_fmt)) return "print";
  return info.clear === undefined || info.clear >= 0.01 ? "cutout" : "print";
}

// The box round what is opaque (alpha 128 or more) in an alpha plane w x h, and the share of clear pixels. null when
// nothing is opaque.
export function alphaBox(g, w, h) {
  if (!(Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0 && g?.length === w * h))
    throw new Error("alphaBox: the size doesn't match the picture");
  let x0 = w, y0 = h, x1 = -1, y1 = -1, clear = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (g[y * w + x] < 128) { clear++; continue; }
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, clear: clear / (w * h) };
}

export function validate(plan) {
  paperOf(plan);
  frameOf(plan);
  gradeOf(plan);
  if (!(plan.clips?.length >= 1)) throw new Error("this look needs at least 1 clip: each clip is a photo card on the page (a video or a photo)");
  const list = plan.texts ?? [];
  for (const t of list) {
    if (!ROLES.includes(t.role))
      throw new Error(`text role "${t.role}" is not used by this look. Use "title", "caption", "price" or "note".`);
    const text = String(t.text ?? "");
    if (!text.trim()) throw new Error(`a "${t.role}" text is empty`);
    if (t.start !== undefined && !(isNum(t.start) && t.start >= 0)) throw new Error(`${quote(t)}: "start" must be seconds, 0 or more`);
    if (t.end !== undefined && !(isNum(t.end) && t.end > (t.start ?? 0))) throw new Error(`${quote(t)} must end after it starts`);
    const rows = text.split("\n").map((r) => r.trim());
    if (rows.some((r) => !r)) throw new Error(`${quote(t)} has an empty row: remove the extra \\n`);
    if (rows.length > ROWS[t.role])
      throw new Error(ROWS[t.role] === 1 ? `${quote(t)}: a ${t.role} is one row: remove the \\n and shorten it`
        : `${quote(t)} has ${rows.length} rows: a ${t.role} takes ${ROWS[t.role]} rows at most`);
    for (const row of rows)
      if ([...row].length > ROW[t.role])
        throw new Error(t.role === "price"
          ? `"${row}" is too long for one price row (${ROW.price} characters at most): shorten it, or split it into 2 rows with \\n`
          : `"${row}" is too long for a ${t.role} (${ROW[t.role]} characters at most): ` +
            (t.role === "title" ? "shorten it to one or two words" : "shorten it"));
    const [file, name] = FONTS[t.role];
    const bad = missing(rows.join(""), join(SKILL_DIR, "fonts", file));
    if (bad.length) throw new Error(`${quote(t)} uses ${bad.join(" ")}, which ${name} can't draw`);
  }
  texts(list, Infinity);
  stickers(plan.stickers, Infinity);
}

// Per clip, after the crop to the photo: the grade. prep runs it, so it records what the card files are made from (the
// clips, the frame and the grade) in the work folder (goat.mjs's .work-<NAME>), for prepare to check. It writes the
// record only when that changes, before prep makes the cards, so a card file older than it comes from a prep that
// stopped halfway.
const record = (plan) => ({ clips: plan.clips ?? [], frame: frameOf(plan), grade: gradeOf(plan) });
export async function clipFilter(clip, ctx) {
  const work = join(ctx.planDir, `.work-${NAME}`), stamp = join(work, "clips.json");
  const now = JSON.stringify(record(ctx.plan));
  mkdirSync(work, { recursive: true });
  if (!existsSync(stamp) || readFileSync(stamp, "utf8") !== now) writeFileSync(stamp, now);
  return GRADES[gradeOf(ctx.plan)];
}

// The photo cards: each clip's card lands on the pile when the clip starts, in two slots in turn (the one under it
// peeks out), and goes once the card two later has landed on top of it. Times on the frame grid.
export function cards(cuts, dur) {
  seconds(dur);
  if (!Array.isArray(cuts) || !cuts.length || !cuts.every(isNum)) throw new Error("the cut times must be seconds");
  const lands = cuts.map(frame);
  return lands.map((land, i) => ({ i, slot: i % 2, land,
    until: i + 2 < lands.length ? Math.min(dur, frame(lands[i + 2] + T.POP)) : dur }));
}

// The words in time order, one of each role at a time (a later one ends the one before), on the frame grid. One that
// runs to the end of the video stays up. dur is Infinity before prep (validate).
export function texts(list, dur) {
  seconds(dur);
  const out = [];
  for (const role of ROLES) {
    const mine = list.filter((t) => t.role === role);
    for (const t of mine) {
      if (!(isNum(t.start ?? 0) && (t.start ?? 0) >= 0)) throw new Error(`${quote(t)}: "start" must be seconds, 0 or more`);
      if (t.end !== undefined && !isNum(t.end)) throw new Error(`${quote(t)}: "end" must be seconds`);
    }
    const order = [...mine].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    order.forEach((t, k) => {
      const start = frame(t.start ?? 0), next = order[k + 1];
      if (start >= dur) throw new Error(`${quote(t)} starts at ${s2(t.start ?? 0)} s, after the video ends (${s2(dur)} s)`);
      const end = frame(Math.min(t.end ?? Infinity, next?.start ?? Infinity, dur));
      if (end - start < T.MIN - EPS)
        throw new Error(`${quote(t)} shows for ${s2(end - start)} s: a ${role} needs ${T.MIN} s (to pop in, be read and go). ` +
          `Move its start or end${next ? `, or the next ${role}'s start` : ""}.`);
      const text = String(t.text).trim();
      out.push({ role, text, rows: text.split("\n").map((r) => r.trim()), start, end, stays: end >= dur - EPS });
    });
  }
  return out.sort((a, b) => a.start - b.start || ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
}

// The stickers in time order, one at a time (a later one ends the one before), on the frame grid; they lean 4° and
// -3° in turn. Numbered in the order they show.
export function stickers(list, dur) {
  seconds(dur);
  if (list === undefined) return [];
  if (!Array.isArray(list) || !list.every((s) => s && typeof s === "object" && typeof s.src === "string" && s.src.trim()))
    throw new Error('"stickers" must be a list like [{"src": "raw/client.png", "start": 0.4}]');
  const order = [...list].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  return order.map((s, k) => {
    const n = `sticker ${k + 1}`;
    if (s.at !== undefined && !(isNum(s.at) && s.at >= 0)) throw new Error(`${n}: "at" must be seconds, 0 or more (the moment of a clip to make it from)`);
    if (s.start !== undefined && !(isNum(s.start) && s.start >= 0)) throw new Error(`${n}: "start" must be seconds, 0 or more`);
    if (s.end !== undefined && !(isNum(s.end) && s.end > (s.start ?? 0))) throw new Error(`${n} must end after it starts`);
    const start = frame(s.start ?? 0), next = order[k + 1];
    if (start >= dur) throw new Error(`${n} starts at ${s2(s.start ?? 0)} s, after the video ends (${s2(dur)} s)`);
    const end = frame(Math.min(s.end ?? Infinity, next?.start ?? Infinity, dur));
    if (end - start < T.MIN - EPS)
      throw new Error(`${n} shows for ${s2(end - start)} s: a sticker needs ${T.MIN} s (to land, be seen and go). ` +
        `Move its start or end${next ? ", or the next sticker's start" : ""}.`);
    return { k, src: s.src, at: s.at, start, end, stays: end >= dur - EPS, tilt: k % 2 ? -3 : 4 };
  });
}

// Captions are written on the card on top. One still up when a new card lands comes on that card (unless less than
// 0.4 s of it is left: then it stays on the card below); one that starts while a card is up writes itself on, unless
// the next card lands within 0.4 s (then it comes with that card instead of writing on the one being covered).
// leave: it fades out while its card is still on top (otherwise it stays on its card as the next lands over it).
export function captions(cs, items, dur) {
  const out = [];
  for (const t of items.filter((x) => x.role === "caption"))
    cs.forEach((c, k) => {
      const top = cs[k + 1]?.land ?? dur, from = Math.max(t.start, c.land), to = Math.min(t.end, top);
      if (to - from < EPS) return;
      const carried = t.start < c.land - EPS;
      if (to - from < T.TAIL - EPS && (carried || top - from < T.TAIL - EPS)) return;
      out.push({ card: c.i, text: t.text, from, to, write: !carried && from > c.land + EPS, leave: to < top - EPS });
    });
  return out.sort((a, b) => a.from - b.from || a.card - b.card);
}

export function schedule(plan, dur, cuts) {
  const cs = cards(cuts, dur), all = texts(plan.texts ?? [], dur);
  return { cards: cs, items: all.filter((t) => t.role !== "caption"), captions: captions(cs, all, dur), stickers: stickers(plan.stickers, dur) };
}

// One sticker's picture as hf/stickers/sticker-<k>.png, at the size it shows (its rim is drawn in the page): the frame
// at `at` of a clip (default its middle) or the photo, read at most 1200 px on its long side; a die-cut one is cropped to
// its subject. Made fresh on every render (a second or so), so it always matches the plan.
async function makeSticker(st, ctx) {
  const path = resolve(ctx.planDir, st.src), name = basename(path), n = `sticker ${st.k + 1}`;
  const info = await probe(path);
  if (!info.video) throw new Error(`${n} (${name}) is a sound file: give a photo or a clip`);
  let at = 0;
  if (!info.still) {
    at = st.at ?? info.dur / 2;
    if (at >= info.dur) throw new Error(`${n}: "at" is ${s2(at)} s but ${name} is only ${s2(info.dur)} s long`);
  }
  // a photo is read upright and whole (photoPng: a phone's EXIF turn, an iPhone HEIC); a clip's frame as it is
  const photo = info.still ? await photoPng(path, join(ctx.work, "photos", `sticker-${st.k}.png`)) : null;
  const pf = photo ? { stdout: photo.pix_fmt }
    : await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=pix_fmt", "-of", "csv=p=0", path]);
  const [W, H] = photo ? [photo.w, photo.h] : [info.w, info.h];
  const k0 = Math.min(1, 1200 / Math.max(W, H));
  const w = Math.max(1, Math.round(W * k0)), h = Math.max(1, Math.round(H * k0));
  const src = photo ? ["-i", join(ctx.work, "photos", `sticker-${st.k}.png`), "-frames:v", "1"]
    : ["-ss", at.toFixed(3), "-i", path, "-frames:v", "1"];
  const read = `scale=${w}:${h}:flags=lanczos,format=rgba`;
  const raw = await run("ffmpeg", ["-v", "error", ...src, "-vf", read, "-f", "rawvideo", "-"], { binary: true });
  if (raw.code || raw.stdout.length < w * h * 4)
    throw new Error(`could not read a picture from ${name}: ${String(raw.stderr).trim().slice(-300)}`);
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = raw.stdout[i * 4 + 3];
  const box = alphaBox(alpha, w, h);
  if (!box) throw new Error(`${n} (${name}) is fully transparent: nothing to make a sticker of`);
  const mode = stickerMode({ pix_fmt: pf.stdout.trim().split(/\s/)[0] || "unknown", clear: box.clear });
  const c = mode === "cutout" ? box : { x: 0, y: 0, w, h };
  const k = Math.min(BOX[mode][0] / c.w, BOX[mode][1] / c.h);
  const dw = Math.max(1, Math.round(c.w * k)), dh = Math.max(1, Math.round(c.h * k));
  // a die-cut's rim grows from its 50% outline, so anything fainter would draw with no rim behind it (a ghost jacket, a
  // stray speck): ramp the alpha steeply round 128, so a pixel is either solid, gone, or an edge next to the rim
  const solid = mode === "cutout" ? ",lutrgb=a='clip((val-120)*16,0,255)'" : "";
  mkdirSync(join(ctx.hfDir, "stickers"), { recursive: true });
  await ffmpeg([...src, "-vf", `${read},crop=${c.w}:${c.h}:${c.x}:${c.y},scale=${dw}:${dh}:flags=lanczos,format=rgba${solid}`,
    join(ctx.hfDir, "stickers", `sticker-${st.k}.png`)], `make ${n} from ${name}`);
  console.log(mode === "cutout" ? `[goat] ${n} (${name}): a transparent background, so a die-cut sticker round its subject`
    : `[goat] ${n} (${name}): no transparent background, so a printed sticker with a white rim. For a die-cut one, ` +
      "give the photo with its background removed (Copy Subject on the phone, or Remove Background on a Mac).");
  return { mode, w: dw, h: dh };
}

// HyperFrames finds videos in the page's HTML, so the cards go into index.html ({{CARDS}}): each card's video starts
// when it lands, playing clip-<i>.mp4 from 0 (which holds its last frame), until the card goes. The stickers' pictures
// and the small copies of the cards that go (stills/card-<i>.jpg) go in too ({{STICKERS}}, {{MINIS}}), so the page has
// them loaded before the first frame.
export async function prepare(ctx) {
  const stamp = join(ctx.work, "clips.json");
  if (!existsSync(stamp)) throw new Error(`the clips weren't recorded (prepared by an older version): run "prep" again`);
  const was = JSON.parse(readFileSync(stamp, "utf8")), now = record(ctx.plan);
  if (was.frame !== now.frame)
    throw new Error(`the photos were prepared for the "${was.frame}" frame but the plan now says "${now.frame}": run "prep" again`);
  if (was.grade !== now.grade) throw new Error(`the footage was graded "${was.grade}" but the plan now says "${now.grade}": run "prep" again`);
  if (JSON.stringify(was.clips) !== JSON.stringify(now.clips)) throw new Error(`the clips changed since prep: run "prep" again`);
  for (let i = 0; i < ctx.cuts.length; i++) {
    const card = join(ctx.work, "media", `clip-${i}.mp4`);
    if (!existsSync(card)) throw new Error(`media/clip-${i}.mp4 is missing: run "prep" again`);
    if (statSync(card).mtimeMs < statSync(stamp).mtimeMs)
      throw new Error(`media/clip-${i}.mp4 is older than the clips it should show: run "prep" again`);
  }
  const s = schedule(ctx.plan, ctx.dur, ctx.cuts);
  const made = [];
  for (const st of s.stickers) made.push({ ...st, ...(await makeSticker(st, ctx)) });
  // the lower page: a card that goes (covered on the pile) leaves a small copy of its clip's last frame there
  const [fw, fh] = FIT(ctx.plan), minis = s.cards.filter((c) => c.until < ctx.dur - EPS);
  mkdirSync(join(ctx.hfDir, "stills"), { recursive: true });
  for (const c of minis) {
    const len = (s.cards[c.i + 1]?.land ?? ctx.dur) - c.land, file = join(ctx.hfDir, "stills", `card-${c.i}.jpg`);
    rmSync(file, { force: true }); // never pass on a still from an earlier render
    const r = await run("ffmpeg", ["-y", "-v", "error", "-ss", Math.max(0, len - 1 / 30).toFixed(3), "-i",
      join(ctx.work, "media", `clip-${c.i}.mp4`), "-frames:v", "1", "-q:v", "2", file]);
    if (r.code || !existsSync(file)) throw new Error(`could not read the last frame of media/clip-${c.i}.mp4: run "prep" again`);
  }
  const CARDS = s.cards.map((c) => `<div class="card s${c.slot}" id="card-${c.i}"><div class="pop"><div class="jit">` +
    `<div class="pola"><div class="pic"><video id="clip-${c.i}" src="media/clip-${c.i}.mp4" data-start="${num(c.land)}" ` +
    `data-duration="${num(c.until - c.land)}" data-media-start="0" data-track-index="${c.i + 1}" muted playsinline></video></div>` +
    `<div class="cap"></div></div><i class="tape t0"></i><i class="tape t1"></i></div></div></div>`).join("\n");
  const STICKERS = made.map((x) => `<div class="sticker ${x.mode}" id="sticker-${x.k}"><div class="pop"><div class="jit">` +
    `<div class="rim"><img src="stickers/sticker-${x.k}.png" width="${x.w}" height="${x.h}" alt=""></div></div></div></div>`).join("\n");
  const MINIS = minis.map((c) => `<div class="mini" id="mini-${c.i}"><div class="pop"><div class="jit"><div class="mpola">` +
    `<img src="stills/card-${c.i}.jpg" width="${fw}" height="${fh}" alt=""></div></div></div></div>`).join("\n");
  return { ...s, stickers: made, frame: now.frame, paper: paperOf(ctx.plan), T, html: { CARDS, STICKERS, MINIS } };
}

// v1's events at about 30% of its levels (Saagii, 15 Nov: half was still "a bit too much" on 08); members raise them
// with "sfx": {"volume": …}. Paper as a photo card lands and as a sticker drops, a pop for the price circle, a short
// marker scribble as the title or a note lands. Nothing for what is on the page at frame 0, nothing for the jitter, and
// never two within 0.5 s (the earlier one plays).
export function sfx(plan, ctx) {
  const s = schedule(plan, ctx.dur, ctx.cuts);
  const ev = [
    ...s.cards.filter((c) => c.land > EPS).map((c) => ({ sound: "paper", at: r3(c.land), volume: 0.3 })),
    ...s.stickers.filter((x) => x.start > EPS).map((x) => ({ sound: "paper", at: r3(x.start), volume: 0.36 })),
    ...s.items.filter((t) => t.start > EPS).map((t) => (t.role === "price" ? { sound: "pop", at: r3(t.start), volume: 0.3 }
      : { sound: "marker", at: r3(t.start), volume: 0.3, dur: 0.5 })),
  ].sort((a, b) => a.at - b.at);
  let last = -Infinity;
  return ev.filter((e) => e.at - last >= 0.5 - EPS && ((last = e.at), true));
}
