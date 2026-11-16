---
name: goat-scrapbook
description: Scrapbook Sticker · Наалттай цомог. Puts the user's clips on a cream paper page inside taped Polaroid photos that land one on another, turns the user's photos into stickers with a thick white edge (die-cut round the person or product when the photo's background is removed), adds a marker title, a yellow price circle and handwritten Mongolian notes, with stop-motion hops. Built on HyperFrames. Renders a 1080x1920 MP4 for Reels/TikTok. Best for beauty, nails, salons, barbers (the fresh cut as a sticker), boutiques, products and coaching "journal" reels. Use whenever the user wants a scrapbook, collage, sticker, cut-out, Polaroid or "наалт" edit, or types /goat-scrapbook, /наалт, or says "наалттай цомог шиг хий", "стикер болгоод өг", "make it a scrapbook", even if they don't name the skill.
---

# Scrapbook Sticker · Наалттай цомог

A cream (or kraft) paper page with a soft grain. Each clip plays inside a taped Polaroid that lands on a little pile, the photo before it still peeking out underneath. The user's photo of a client, haircut or product becomes a sticker with a thick white edge: cut round its shape when the photo's background was removed, or a rounded printed sticker when it wasn't. A marker title sits at the top, a yellow circle holds the price, and a note handwritten on a torn strip of ruled paper sits under the photos. As the video goes on, the photos already covered on the pile drop, small, onto the lower page, so the page fills up like a real scrapbook spread. Every paper piece pops onto the page and hops 8 times a second like stop-motion, while the footage inside the photo plays smoothly. It is the only GOAT look where the footage never fills the screen and people become stickers.

**Good for:** beauty, nails, salon mood boards, barbers (the fresh cut as a sticker), boutiques, products, coaching "journal" reels.
**Not for:** cars and property (it reads as casual where trust matters). A talking head works, but the face is small (the photo is 464 px wide) and the voice plays under the page; for a speaker, suggest a look made for one (goat-word-behind). If the user's footage is like this, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`. `goat` below means `node SKILL_DIR/scripts/goat.mjs`.

## 1. Setup check (first time on a machine)

**Every new video, first:** run `claude plugin marketplace update goat-scrapbook`, then `claude plugin update goat-scrapbook@goat-scrapbook`. If it installs a new version, tell the user a new version was installed and ask them to type `/reload-plugins` before you go on. If either command fails (offline, or installed from a zip), carry on and don't mention it.

Run `node --version` (needs 22 or newer) and `ffmpeg -version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install node ffmpeg`
- Windows: `winget install OpenJS.NodeJS.LTS` and `winget install Gyan.FFmpeg`, then close and reopen the terminal.

This look has no captions and cuts nobody out, so it needs no speech or cut-out model. The first render downloads, once, a private copy of Chrome that draws the frames. Tell the user the first run takes a while; after that it starts at once. Nothing is uploaded: everything runs on their computer, with no account.

**Long steps:** the first `render` (the Chrome download) can run longer than a normal command timeout. Run it in the background, or with a 600000 ms timeout, and wait for it to end. Never stop it and start it again.

**Windows has not been tested yet.** If a step fails there, show the error to the user in plain words.

## 2. Collect the clips, photos and words

Make `raw/` and `output/` in the current folder. Ask for:
1. **The clips** for the photo cards (videos or photos); 3–6 is a good number. Each one becomes a Polaroid on the pile, in order.
2. **The sticker photos** (optional, one or more): the client, the haircut, the product. Just ask them to put in the photo. A photo with its background removed becomes a die-cut sticker that follows its shape; any other photo becomes a printed sticker (the whole photo, rounded, with the same white edge). For the die-cut kind, tell them how to remove the background, but never require it:
   - iPhone: open the photo, touch and hold the person or product until it glows (Copy Subject), then tap **Share…** → **AirDrop** to send it to this computer as a PNG; or tap **Copy**, paste it into a new note in **Notes** and share it from there (AirDrop or **Save to Files**). Put the PNG in `raw/`. A picture pasted straight into this chat is not saved as a file, so it can't be used.
   - Samsung: touch and hold the person or product, then **Save as image**. Google Photos (Android): touch and hold, then copy or save it.
   - Mac: in Finder, right-click the photo → **Quick Actions** → **Remove Background**.
   - Windows: open the photo in **Paint** → **Remove background**, then save it as PNG.
   A clip can be a sticker too: say which moment (`at`, in seconds); it becomes a printed sticker of that frame.
3. **The words:** a short title (1–2 words, e.g. "ХУМС"), a caption for each photo, the price (only if they give one), and one or two short handwritten notes. Every word comes from the user or from what the photos show. Never invent a price, phone number or date. Ask. No emoji or symbols such as ★ ♥ ✓: the fonts can't draw them (render refuses them).

Then run `goat probe raw/*`. It prints each file's size, length, whether it has sound and whether it is HDR. To see before rendering which sticker photos have their background removed, run `ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 raw/client.png` for each: `rgba`, `yuva420p` or another format with an `a` for alpha (not `gray`) means a die-cut sticker, unless it's opaque everywhere (a screenshot saved as PNG often is: then it's printed); anything else a printed one. Render says it again for each sticker.

## 3. Prepare

Write `plan.json` in the project folder (paths are relative to it):

```json
{
  "output": "output/scrapbook.mp4",
  "clips": [
    {"src": "raw/nails.mp4", "in": 0.5, "out": 3.5},
    {"src": "raw/salon.jpg", "dur": 3},
    {"src": "raw/IMG_0415.MOV", "in": 1.0, "out": 4.0, "cy": 0.4}
  ],
  "stickers": [
    {"src": "raw/client.png", "start": 0.4, "end": 6},
    {"src": "raw/product.jpg", "start": 6}
  ],
  "texts": [
    {"role": "title", "text": "ХУМС", "start": 0},
    {"role": "caption", "text": "шинэ хумс", "start": 0, "end": 3},
    {"role": "price", "text": "Шинэ\nзагвар", "start": 0.8},
    {"role": "note", "text": "өнөөдрийн засалт", "start": 1.2, "end": 6},
    {"role": "caption", "text": "салоны өдөр", "start": 3},
    {"role": "note", "text": "цаг захиалаарай", "start": 6.2}
  ],
  "look": {"paper": "cream", "frame": "polaroid", "grade": "true"}
}
```

**clips** become the photo cards, in order. `dur` sets how long a photo shows; `in`/`out` trim a video (seconds). `cx`/`cy` (0–1, default 0.5) choose which part of the picture the photo keeps (`cy: 0.3` keeps the upper part). Add `"sound": false` to mute one clip. The video is as long as all the clips together. Each card lands on the pile as its clip starts (the first is already there on frame 0), in two places in turn, so the card before peeks out under it; a card's clip plays in it, and when the clip ends the card keeps its last frame until the card after next covers it. Then a small copy of it (that last frame) pops onto the lower page, where the earlier photos collect. That part of the page sits where app text can cover it, so it never holds words.

**stickers** (optional): each one is made from `src` (a photo, or for a clip the frame at `at` seconds, default its middle) and shows from `start` to `end`, one at a time on the right side of the page (a later one ends the one before; each needs 1 s at least). They lean 4° and −3° in turn. A die-cut one is up to 562x928 px (594x960 with its edge, as big as the preview's); any part of it that is more than about half see-through is dropped, so nothing draws outside its white edge, a printed one up to 400x560, so a printed rectangle stays off the photo cards. A sticker hangs low on the page, so app buttons can cover its lower part: put what matters (a face, the product's label) near its top.

Then run these in order. Each one says what to run first if a step is missing.
1. `goat prep plan.json`: crops every clip to the photo (464x464 for `polaroid`, 480x600 for `print`), grades it (`grade`), and makes one file per card in `.work-scrapbook/media/`. **Run it again whenever `clips`, `frame` or `grade` change** (render refuses cards made from other clips or another frame or grade).
2. `goat cut plan.json`: this look never cuts pauses; the step only readies the video and takes a second.

**Check the framing** before writing the words. Pull one frame of each card, 0.4 s into its file:
`ffmpeg -y -loglevel error -ss 0.4 -i .work-scrapbook/media/clip-0.mp4 -frames:v 1 output/card-1.jpg` (clip-1.mp4 is the 2nd card, and so on). Read them. If a face or the work is cut off, move `cx`/`cy` toward it and run `prep` again.

## 4. Write the words

**texts** (only one of each role shows at a time: a later one ends the one before). Every word sits inside the area no app buttons cover. A text longer than its limit, or with a `\n` where the role takes one row, is refused with a message: shorten it.
- `title`: the big marker word at the top (Rubik Marker Hatch, up to 170 px, leaning −4°). **One row, at most 11 characters** (spaces count); a long one shrinks to fit the 840 px row, to 64 px at the least. Written as you type it, so type it in capitals for the look of the preview.
- `caption`: handwriting on the photo card under the picture (Caveat Bold, up to 56 px; on a `print`, up to 44 px on a strip of masking tape across the photo's lower edge). **One row, at most 14 characters**; it shrinks to 38 px at the least. A caption still up when a new card lands comes onto that card (unless less than 0.4 s of it is left); one that starts while a card is up writes itself on, left to right (unless the next card lands within 0.4 s: then it comes with that card).
- `price`: inside the yellow circle (Pangolin, up to 56 px). Put a price, phone number or offer here (only ones the user gave), or one or two short words. **At most 2 rows (split with `\n`), 7 characters a row**; it shrinks to 32 px at the least. a 7-character row of numbers fits at the full 56 px; wide letters shrink it.
- `note`: handwriting on a torn strip of ruled paper under the photos (Caveat Bold, up to 72 px, leaning −3°), so it reads even where it crosses a sticker. **One row, at most 22 characters**; it shrinks to 44 px at the least. Good for a feeling ("өнөөдрийн засалт") or a short call to action.
Each text needs **1 s on screen** at least (it pops in over 7 frames and fades out over 0.15 s); a shorter one is refused. A text that runs to the end of the video stays up on the last frame.

**The first frame is the Reels thumbnail.** The first photo card is always on it. Start the title at `0` so it is there too, already in place with no pop. Anything else that starts at `0` (a sticker, the price) is there on the thumbnail too, for a fuller cover; then it simply sits there with no pop and no sound.

**Timing:** 2–4 s per clip. Start the sticker, the price and the notes a little after the card lands (0.3–1 s apart), so the pieces arrive one after another, as in the example. A caption or title without an `end` stays up over the next cards too: when the next photo shows something else, end it at that clip's start (or give the next clip its own caption, which ends the one before).

**look** options:
- `paper`: `cream` (default) or `kraft` (brown).
- `frame`: `polaroid` (a square photo in a Polaroid with a caption strip, two pieces of tape at its corners; leans −6° and −3° in turn; default) or `print` (a taller 480x600 print with a thin white border, one piece of tape on top and its caption on masking tape; leans −4° and −2°).
- `grade`: `true` (true colour, default; right for nail and hair colour) or `vintage` (faded film colour).

**Auto sound effects** (soft, about a third of the old version's levels; raise them with `"sfx": {"volume": 1.5}`): a paper rustle as each card lands and as each sticker drops, a pop for the price circle, a short marker scribble as the title or a note lands. Nothing for what is already on the page on frame 0, nothing for the stop-motion hops, and never two within 0.5 s (the earlier one plays).

Before rendering, tell the user the plan in plain words (the cards in order, which sticker is die-cut and which printed, the words, the paper colour) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio-node.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `node SKILL_DIR/scripts/goat.mjs probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 5. Render and check

`goat render plan.json`

It makes the stickers, draws the page, the cards and the words, mixes the sound and writes the MP4 plus a contact sheet (one frame per second) at `.work-scrapbook/sheet.jpg`. Its first lines say, for each sticker, whether it is die-cut or printed. On our test Mac a 9 s video of 3 clips and two stickers took 13–22 s to render (prep and cut 2 s), a 12.7 s one of 6 clips and four stickers 19–26 s (prep 5 s), and a 56 s video of 12 clips and four stickers 103–117 s (prep and cut 33 s). Longer videos take longer. Run the next render only after the last one ends.

Read the contact sheet, the first frame, and full-size frames when nothing is moving: 0.4 s after each card lands (its clip's start) and 0.1 s before each clip ends; never during the 7-frame pop. For the example plan (cards land at 0, 3 and 6 s):
`ffmpeg -y -loglevel error -i output/scrapbook.mp4 -frames:v 1 output/check-0.jpg` (the thumbnail: card, title)
`ffmpeg -y -loglevel error -ss 2.9 -i output/scrapbook.mp4 -frames:v 1 output/check-2.9.jpg` (the sticker, price, note)
`ffmpeg -y -loglevel error -ss 6.4 -i output/scrapbook.mp4 -frames:v 1 output/check-6.4.jpg` (the third card on the pile, the second sticker)
Check that:
- every word is spelled right (Ө ө Ү ү!) and whole;
- each sticker is clean: a die-cut one has no leftover bits of background with their own white edge (if it has, ask for the photo cut out again), and nothing important sits low on it;
- each card shows the work (fix with `cx`/`cy`), and no sticker or price circle covers a face in a card.

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 6. Hand over

Tell the user where the file is (`output/scrapbook.mp4`) and that it is ready to post. Music can be added in the Instagram/TikTok app.

## Rules

- Every word and graphic on screen comes from what this video says or shows, or from what the user gave you. The examples in this file are only examples: never put them in a video. If the user hasn't given the words, ask.
- A price, phone number or offer goes in the `price` circle (or the `title`); never invent one. Ask.
- A photo without a transparent background is never refused: it becomes a printed sticker. Removing the background is the user's choice.
- Use only the fonts bundled in `SKILL_DIR/fonts` (they have Ө ө Ү ү and ₮). Don't swap in other fonts.
- The output is 1080x1920, 30 fps, H.264. The clips' own sound, the voice-over and the music are brought to -14 LUFS together (Instagram/TikTok level) and the effects play on top. With nothing to bring up (photos or silent clips, no music or voice-over) the effects play alone, so such a reel is much quieter than that (our silent tests: -37 to -39 LUFS); add music in the app.
