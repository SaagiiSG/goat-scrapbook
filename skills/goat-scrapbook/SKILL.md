---
name: goat-scrapbook
description: Scrapbook Sticker · Наалттай цомог. Puts the user's clips on a cream paper page inside taped Polaroid photos, turns a person or product into a cut-out sticker with a thick white edge, adds a yellow price circle and handwritten Mongolian notes, with stop-motion hops. Renders a 1080x1920 MP4 for Reels/TikTok. Best for beauty, nails, salons, barbers (the fresh cut as a sticker), boutiques, products and coaching "journal" reels. Use whenever the user wants a scrapbook, collage, sticker, cut-out, Polaroid or "наалт" edit, or types /goat-scrapbook, /наалт, or says "наалттай цомог шиг хий", "стикер болгоод өг", "make it a scrapbook", even if they don't name the skill.
---

# Scrapbook Sticker · Наалттай цомог

A cream paper page. The clip plays inside a taped Polaroid, the client, haircut or product becomes a cut-out sticker with a thick white edge, a yellow circle holds the price, and handwritten notes sit beside them. Paper pieces hop into place like stop-motion while the footage inside the photo plays smoothly. It is the only GOAT look where the footage never fills the screen.

**Good for:** beauty, nails, salon mood boards, barbers (the fresh cut, head cut out), boutiques, products, coaching "journal" reels.
**Not for:** cars and property (it reads as casual where trust matters, and rooms can't be cut out). If the user's footage is one of these, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`.

## 1. Setup check (first time on a machine)

Run `ffmpeg -version` and `uv --version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install ffmpeg uv`
- Windows: `winget install Gyan.FFmpeg` and `winget install astral-sh.uv`, then close and reopen the terminal.

The first render installs the Python packages (Pillow, numpy, scipy, rembg) and **downloads the cut-out model once, about 170 MB**. Tell the user the first run takes a few minutes; after that it is fast. It needs Python 3.11 or 3.12, which uv fetches by itself.

## 2. Collect the clips and words

Make `raw/` and `output/` in the current folder. Ask for:
1. **The clips** for the Polaroid photos (videos or photos). Each clip gets its own photo card.
2. **What becomes a sticker:** a clip or photo with the person or product in front of a plain background. For a video, pick the moment (`at`, in seconds) where they hold still. Ask the user to hold still for 2 seconds at the sticker moment when filming.
3. **The words:** a short title (1–2 words, e.g. "ШИНЭ"), a caption per photo, the price, and one or two handwritten notes. Never invent a price. Ask. No emoji in notes: the handwriting font can't draw them (they are left out with a warning).

If this folder was already edited with `goat-video-editor`, `output/cut.mp4` can be a clip.

Then run: `uv run SKILL_DIR/scripts/goatcut.py probe raw/*`
It prints each file's size, length, whether it has sound, whether it is HDR, and `speech` spans.

## 3. Write plan.json

Write `plan.json` in the project folder. Paths are relative to it.

```json
{
  "output": "output/scrapbook.mp4",
  "clips": [
    {"src": "raw/nails.mp4", "in": 0.5, "out": 3.5},
    {"src": "raw/salon.jpg", "dur": 3.0}
  ],
  "stickers": [
    {"src": "raw/client.mp4", "at": 2.0, "start": 0.4, "end": 3.5},
    {"src": "raw/product.jpg", "start": 3.5}
  ],
  "texts": [
    {"role": "title",   "text": "ШИНЭ", "start": 0.0},
    {"role": "caption", "text": "шинэ хумс", "start": 0.3, "end": 3.5},
    {"role": "price",   "text": "25 000₮", "start": 0.6},
    {"role": "note",    "text": "цаг захиалаарай", "start": 0.8}
  ],
  "look": {"paper": "cream", "frame": "polaroid", "grade": "true"}
}
```

**clips** play in order, each inside its own photo card that lands at the cut. `in`/`out` trim a video; `dur` sets how long a photo shows; `cx`/`cy` (0–1) choose which part of the frame the photo keeps. `"sound": false` mutes one clip.
**stickers:** each one is cut out of `src` (for a video, the frame at `at` seconds) and shown from `start` to `end`. Only one sticker shows at a time, on the right side of the page. If the cut-out fails ("no person or product found"), ask for a shot with a plainer background.
**texts:**
- `title`: big marker-style word at the top.
- `caption`: small handwriting on the photo card under the picture.
- `price`: inside the yellow circle. Put prices and phone numbers here: it is inside the area no app buttons cover.
- `note`: handwriting below the photo. It sits low on the screen, so use it for feelings ("өнөөдрийн засалт"), not for the price or phone.
Only one of each role shows at a time. Long words shrink to fit.
**look** options:
- `paper`: `cream` (default) or `kraft` (brown).
- `frame`: `polaroid` (square photo, default) or `print` (taller photo).
- `grade`: `true` (true colour, default; right for nail and hair colour) or `vintage` (faded).

**Auto sound effects:** paper and a tape pull as each photo card lands, paper as each sticker drops, a pop for the price circle, a short marker scribble as the title and each note appear.

**Timing:** 2–4 s per photo. Start stickers and notes a little after the photo lands (0.3–0.8 s) so pieces arrive one after another.

Before rendering, tell the user the plan in plain words (photos, sticker, words, paper colour) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `goatcut.py probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 4. Render and check

`uv run SKILL_DIR/scripts/render.py plan.json`

Cut-outs are cached next to the output, so a re-render with new words doesn't cut out again. Then look at three frames before saying it is done:
`ffmpeg -y -loglevel error -ss 2 -i output/scrapbook.mp4 -frames:v 1 output/check-1.jpg` (and two more times). Read them. Check the sticker is clean (no leftover background blobs), words are not cut off, and the price is readable.

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 5. Hand over

Tell the user where the file is (`output/scrapbook.mp4`) and that it is ready to post. Captions and music can be added in the Instagram/TikTok app.

## Rules

- Prices and phone numbers go only in `price`.
- Use only the fonts bundled in `SKILL_DIR/fonts` (they have Ө ө Ү ү). Don't swap in other fonts.
- The cut-out model is rembg `isnet-general-use`, named on purpose: rembg's default model is non-commercial. Don't change it.
- The output is 1080x1920, 30 fps, H.264, sound at -14 LUFS (Instagram/TikTok level).
