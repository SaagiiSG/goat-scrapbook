# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = ["pillow>=10.4", "numpy", "scipy", "rembg[cpu]>=2.0.80,<3"]
# ///
"""Scrapbook Sticker · Наалттай цомог.

A cream paper page: the clip plays inside a taped Polaroid, a person or product becomes a cut-out
sticker with a thick white edge, a yellow price circle and handwritten notes. Paper pieces hop at
8 fps like stop-motion while the footage inside the photo plays smoothly.
Usage: uv run render.py plan.json
"""
import hashlib
import io
import math
import random
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import goatcut as g  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

NAME = "scrapbook"
W, H = g.W, g.H
STEP = 8                      # paper pieces move at 8 fps; footage inside the photo stays at 30
POP = 0.23                    # a piece lands in 7 frames: soft, small overshoot, no bounce
PAPERS = {"cream": (242, 235, 221), "kraft": (200, 162, 122)}
GRADES = {"true": "null", "vintage": "curves=preset=vintage"}
INK, PEN = (43, 38, 34, 255), (58, 53, 48, 255)
TAPES = [(244, 182, 194, 199), (168, 213, 186, 199), (249, 231, 159, 199)]  # 78% opacity
HAND, ROUND, MARKER = "Caveat[wght].ttf", "Pangolin-Regular.ttf", "RubikMarkerHatch-Regular.ttf"
M = 64                        # transparent margin around the photo card (tape, shadow)
# frame: picture size, card size, picture offset on the card, caption centre y (card coords), tapes (cx, cy, deg)
FRAMES = {
    "polaroid": {"pic": (464, 464), "card": (508, 613), "at": (22, 22), "cap": 539,
                 "tapes": [(55, 5, -28), (462, 11, 24)]},
    "print": {"pic": (480, 600), "card": (512, 632), "at": (16, 16), "cap": 690,
              "tapes": [(256, 0, -3)]},
}
PHOTO_C = (330, 882)          # photo card centre; the preview phone's layout at 1080x1920
STICKER = (761, 691, 594, 880)  # sticker centre x, top y, max w, max h
TILTS = (-6, -3)
POSES = [(0, 0, 0), (5, -4, 0.5), (-4, 3, -0.4), (3, 5, 0.3)]  # jitter poses: dx, dy, degrees


def choice(ctx, key, table, default):
    v = ctx.opt(key, default)
    if v not in table:
        g.die(f'look.{key} must be one of {", ".join(table)}')
    return v


def FIT_SIZE(ctx):
    return FRAMES[choice(ctx, "frame", FRAMES, "polaroid")]["pic"]


def GRADE(ctx):
    return GRADES[choice(ctx, "grade", GRADES, "true")]


# ---------------------------------------------------------------- cut-outs

_session = None


def still(ctx, src, at=None):
    """One frame of a clip (or a photo) as RGB, long side 1280."""
    p = ctx.path(src)
    info = g.probe(p)
    if not info["still"]:
        at = info["dur"] / 2 if at is None else float(at)
        if not 0 <= at < info["dur"]:
            g.die(f'sticker "at" must be between 0 and {info["dur"]:.1f} for {p.name}')
    seek = [] if info["still"] else ["-ss", f"{at:.3f}"]
    r = subprocess.run(["ffmpeg", "-v", "error", *seek, "-i", str(p), "-frames:v", "1",
                        "-vf", "scale=1280:1280:force_original_aspect_ratio=decrease",
                        "-f", "image2pipe", "-c:v", "png", "-"], capture_output=True)
    if r.returncode or not r.stdout:
        g.die(f"could not read a picture from {p.name}")
    return Image.open(io.BytesIO(r.stdout)).convert("RGB")


def cutout(ctx, src, at=None):
    """The subject of one frame on a transparent background, cropped tight. Cached next to the output,
    so a re-render with new words does not cut out again."""
    global _session
    p = ctx.path(src)
    out = (ctx.plan_dir / ctx.plan.get("output", f"output/{NAME}.mp4")).resolve()
    f = out.parent / f".work-{NAME}" / f"cut-{hashlib.sha1(f'{p}|{p.stat().st_mtime}|{at}'.encode()).hexdigest()[:12]}.png"
    if f.exists():
        return Image.open(f).convert("RGBA")
    import numpy as np
    from rembg import new_session, remove
    from scipy import ndimage
    if _session is None:
        print("[scrapbook] cutting out stickers. The first time ever, this downloads the "
              "isnet-general-use model (about 170 MB).", flush=True)
        _session = new_session("isnet-general-use")  # named on purpose: rembg's default model is non-commercial
    cut = remove(still(ctx, src, at), session=_session, post_process_mask=True)
    a = np.array(cut.getchannel("A")) > 127
    lab, n = ndimage.label(a)
    if n == 0:
        g.die(f"no person or product found in {p.name}. Use a shot with the subject in front of a plain wall.")
    sizes = ndimage.sum(a, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.flatnonzero(sizes >= sizes.max() * 0.05))  # drop specks, they'd get white rims
    cut.putalpha(Image.fromarray(np.where(keep, np.array(cut.getchannel("A")), 0).astype(np.uint8)))
    cut = cut.crop(cut.getbbox())
    cut.save(f)
    return cut


def die_cut(cut, max_w, max_h, edge=16):
    """Cut-out with a white die-cut sticker edge (14-20 px reads as a sticker, under 10 as a halo)."""
    import numpy as np
    from scipy import ndimage
    k = min((max_w - 2 * edge) / cut.width, (max_h - 2 * edge) / cut.height)
    cut = cut.resize((max(1, round(cut.width * k)), max(1, round(cut.height * k))), Image.LANCZOS)
    pad = edge + 2
    s = Image.new("RGBA", (cut.width + 2 * pad, cut.height + 2 * pad), (255, 255, 255, 0))
    s.alpha_composite(cut, (pad, pad))
    # a die-cut follows the outer outline only, so holes inside the subject are backed with white
    dist = ndimage.distance_transform_edt(~ndimage.binary_fill_holes(np.array(s.getchannel("A")) > 127))
    rim = Image.new("RGBA", s.size, (255, 255, 255, 255))
    rim.putalpha(Image.fromarray((np.clip(edge + 0.5 - dist, 0, 1) * 255).astype(np.uint8)))
    rim.alpha_composite(s)
    return rim


# ---------------------------------------------------------------- paper pieces

def ink(text, font, fill):
    """g.text_sprite one line at a time, stacked and centred."""
    rows = [g.text_sprite(ln, font, fill=fill) for ln in text.split("\n")]
    gap = int(font.size * 0.18)
    out = Image.new("RGBA", (max(r.width for r in rows), sum(r.height for r in rows) + gap * (len(rows) - 1)))
    y = 0
    for r in rows:
        out.alpha_composite(r, ((out.width - r.width) // 2, y))
        y += r.height + gap
    return out


def shadowed(sprite, dx, dy, blur, a):
    m = blur * 3 + max(abs(dx), abs(dy))
    sh = Image.new("RGBA", (sprite.width + 2 * m, sprite.height + 2 * m), (0, 0, 0, 0))
    sh.paste((0, 0, 0, int(255 * a)), (m + dx, m + dy), sprite.getchannel("A"))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    sh.alpha_composite(sprite, (m, m))
    return sh


def paper(color):
    """Cream or kraft paper with 0-8% multiplied grain: fine fibre plus soft blotches."""
    from PIL import ImageChops
    fine = Image.effect_noise((W, H), 60)
    mid = Image.effect_noise((W // 4, H // 4), 60).resize((W, H), Image.BICUBIC)
    blot = Image.effect_noise((W // 24, H // 24), 60).resize((W, H), Image.BICUBIC)
    n = Image.blend(Image.blend(fine, mid, 0.4), blot, 0.35).point(lambda v: 234 + v * 21 // 255)
    return ImageChops.multiply(Image.new("RGB", (W, H), color), Image.merge("RGB", (n, n, n))).convert("RGBA")


def tape(color, w=193, h=46):
    """A strip of masking tape with torn, zig-zag ends."""
    teeth = [(0, 0), (6, 0.25), (0, 0.5), (6, 0.75), (0, 1)]
    pts = [(x, y * h) for x, y in teeth] + [(w - x, y * h) for x, y in reversed(teeth)]
    s = Image.new("RGBA", (w * 2, h * 2), (0, 0, 0, 0))
    ImageDraw.Draw(s).polygon([(x * 2, y * 2) for x, y in pts], fill=color)
    return s.resize((w, h), Image.LANCZOS)


def card(ctx, caption):
    """The photo card without its picture: shadow, card, handwritten caption."""
    fr = ctx.frame
    cw, ch = fr["card"]
    under = Image.new("RGBA", (cw + 2 * M, ch + 2 * M + 60), (0, 0, 0, 0))
    plain = Image.new("RGBA", (cw, ch), (243, 240, 232, 255))
    sh = shadowed(plain, 8, 14, 8, 0.28)
    under.alpha_composite(sh, (M - (sh.width - cw) // 2, M - (sh.height - ch) // 2))
    if caption:
        f = ctx.fit(caption, HAND, cw - 60, 56, 28, axes={"wght": 700})
        g.paste(under, ink(caption, f, PEN), M + cw / 2, M + fr["cap"], anchor="mm")
    return under


def tapes(ctx, i):
    over = Image.new("RGBA", (ctx.frame["card"][0] + 2 * M, ctx.frame["card"][1] + 2 * M + 60), (0, 0, 0, 0))
    for k, (cx, cy, deg) in enumerate(ctx.frame["tapes"]):
        strip = tape(TAPES[(i + k) % len(TAPES)]).rotate(-deg, Image.BICUBIC, expand=True)
        g.paste(over, strip, M + cx, M + cy, anchor="mm")
    return over


def price_sprite(ctx, text):
    d = 260
    big = Image.new("RGBA", (d * 4, d * 4), (0, 0, 0, 0))
    ImageDraw.Draw(big).ellipse((0, 0, d * 4 - 1, d * 4 - 1), fill=(249, 231, 159, 255))
    disc = big.resize((d, d), Image.LANCZOS)
    lines = text.count("\n") + 1
    f = ctx.fit(text, ROUND, 200, min(60, int(180 / (1.2 * lines))), 24)
    g.paste(disc, ink(text, f, INK), d / 2, d / 2, anchor="mm")
    return shadowed(disc, 6, 10, 6, 0.22)


def pop(t, s, e):
    """(alpha, scale, extra tilt): lands in 7 frames 70% -> 104% -> 100% with a 5 degree settle,
    leaves with a quick 0.15 s fade."""
    a = t - s + 1 / g.FPS  # already showing on its first frame, so a cut never leaves a blank page
    if a < POP:
        p = a / POP
        sc = 0.7 + 0.34 * g.ease_out(p / 0.6) if p < 0.6 else 1.04 - 0.04 * g.ease_in_out((p - 0.6) / 0.4)
        return min(1.0, p * 3), sc, 5 * (1 - g.ease_out(p))
    b = e - t
    if b < 0.15:
        return b / 0.15, 0.92 + 0.08 * b / 0.15, 0
    return 1.0, 1.0, 0


def place(canvas, ctx, key, layers, cx, cy, tilt, s, e, t):
    """Paste a paper piece with its pop and stop-motion jitter: one of 4 poses (the preview's), a new one
    8x a second. layers: [(sprite, dx, dy, live)], offsets from the piece centre. Still layers are turned
    once per pose and cached; a live layer (the footage) turns every frame."""
    a, sc, extra = pop(t, s, e)
    if a <= 0:
        return
    pose = random.Random(f"{ctx.seed}:{key}:{int(t * STEP)}").randrange(len(POSES))
    jx, jy, jr = POSES[pose]
    deg = tilt + extra + jr
    cos, sin = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    for n, (sp, ox, oy, live) in enumerate(layers):
        def turn(sp=sp, live=live):
            img = sp if sc == 1 else sp.resize((round(sp.width * sc), round(sp.height * sc)), Image.BICUBIC)
            return img.rotate(-deg, Image.BILINEAR if live else Image.BICUBIC, expand=True)
        img = ctx.cache(("pose", key, n, id(sp), pose), turn) if sc == 1 and not live else turn()
        g.paste(canvas, img, cx + jx + (ox * cos - oy * sin) * sc, cy + jy + (ox * sin + oy * cos) * sc,
                a, anchor="mm")


# ---------------------------------------------------------------- look

def setup(ctx):
    ctx.seed = ctx.plan.get("seed", 21)
    ctx.last = {}
    ctx.frame = FRAMES[choice(ctx, "frame", FRAMES, "polaroid")]
    ctx.paper = paper(PAPERS[choice(ctx, "paper", PAPERS, "cream")])
    raw = ctx.plan.get("stickers", [])
    if not isinstance(raw, list) or not all(isinstance(s, dict) and s.get("src") for s in raw):
        g.die('"stickers" must be a list like [{"src": "raw/IMG_0412.MOV", "at": 1.5, "start": 0.8}]')
    ctx.stickers = []
    x, top, mw, mh = STICKER
    for k, s in enumerate(sorted(raw, key=lambda s: s.get("start", 0))):
        sp = die_cut(cutout(ctx, s["src"], s.get("at")), mw, mh)
        ctx.stickers.append({**s, "sprite": shadowed(sp, 8, 14, 5, 0.35), "cy": top + sp.height / 2,
                             "tilt": 4 if k % 2 == 0 else -3, "key": f"sticker{k}"})


def SFX(ctx):
    # paper + tape as each photo card lands, paper for each sticker, a pop for the price, a short
    # marker scribble as handwritten words land
    ev = []
    for c in ctx.cuts:
        ev += [{"sound": "paper", "at": c}, {"sound": "tape", "at": c + 0.12, "volume": 0.7}]
    ev += [{"sound": "paper", "at": s.get("start", 0), "volume": 1.2} for s in ctx.stickers]
    ev += [{"sound": "pop", "at": x.get("start", 0)} for x in ctx.texts("price")]
    ev += [{"sound": "marker", "at": x.get("start", 0), "dur": 0.5}
           for x in ctx.texts("title") + ctx.texts("note")]
    return ev


def frame(img, t, ctx):
    canvas = ctx.paper.copy()
    for item in ctx.active(t, "title")[-1:]:
        s = ctx.cache(("title", item["text"]),
                      lambda: ink(item["text"], ctx.fit(item["text"], MARKER, 840, 170, 60), INK))
        place(canvas, ctx, ("title", item["text"]), [(s, 0, 0, False)], 119 + s.width / 2, 280 + s.height / 2, -4,
              item.get("start", 0), item.get("end", ctx.dur), t)

    i, _ = ctx.clip_at(t)
    cap = next((x["text"] for x in ctx.active(t, "caption")[-1:]), "")
    under = ctx.cache(("card", cap), lambda: card(ctx, cap))
    over = ctx.cache(("tapes", i % len(TAPES)), lambda: tapes(ctx, i))
    (px, py), (pw, ph) = ctx.frame["at"], ctx.frame["pic"]
    photo = (img.convert("RGBA"), M + px + pw / 2 - under.width / 2, M + py + ph / 2 - under.height / 2, True)
    end = ctx.cuts[i + 1] if i + 1 < len(ctx.cuts) else ctx.dur
    place(canvas, ctx, f"photo{i}", [(under, 0, 0, False), photo, (over, 0, 0, False)],
          PHOTO_C[0], PHOTO_C[1] + 30, TILTS[i % 2], ctx.cuts[i], end, t)

    for s in [s for s in ctx.stickers if s.get("start", 0) <= t < s.get("end", ctx.dur)][-1:]:
        place(canvas, ctx, s["key"], [(s["sprite"], 0, 0, False)], STICKER[0], s["cy"], s["tilt"],
              s.get("start", 0), s.get("end", ctx.dur), t)
    for item in ctx.active(t, "price")[-1:]:
        s = ctx.cache(("price", item["text"]), lambda: price_sprite(ctx, item["text"]))
        place(canvas, ctx, ("price", item["text"]), [(s, 0, 0, False)], 735, 552, 9, item.get("start", 0), item.get("end", ctx.dur), t)
    for item in ctx.active(t, "note")[-1:]:
        s = ctx.cache(("note", item["text"]), lambda: ink(
            item["text"], ctx.fit(item["text"], HAND, 840, 72, 36, axes={"wght": 700}), PEN))
        place(canvas, ctx, ("note", item["text"]), [(s, 0, 0, False)], 97 + s.width / 2, 1325 + s.height / 2, -3,
              item.get("start", 0), item.get("end", ctx.dur), t)
    return canvas


if __name__ == "__main__":
    g.run(sys.modules[__name__])
