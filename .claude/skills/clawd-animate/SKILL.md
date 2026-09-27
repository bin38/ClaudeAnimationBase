---
name: clawd-animate
description: Make a short hand-painted cartoon video (Clawd or any character) with the Claude Animation Base kit - storyboard, build shot by shot in JS, check contact sheets, render an MP4. Use when the user asks for an animation, animated video, clip, cartoon, GIF or loop, or for new characters, emotions, costumes or props for the kit.
---

# Clawd animation

This kit paints 2D cartoons in code: `src/core.js` (painting, timing, camera, light), `src/clawd.js` (the character),
`src/timeline.js` (shots and transitions), and your scenes in `src/scenes/`. Every frame is a pure function of time.
`ANIMATION_GUIDE.md` holds the rules, the workflow and the full API.

## 0. Find or make the project

- If the working directory has `ANIMATION_GUIDE.md` and `src/core.js`, work there.
- Otherwise start one from the kit: `node <kit>/lite/new.mjs <folder> --duration=<s>`, then `npm run setup` in it.
  With no kit on disk, clone it first: `git clone https://github.com/bin38/ClaudeAnimationBase`.
- The user may name a length, a tempo or a song. Put them in `src/config.js` (`duration`, `bpm`, `offset`, `audio`).

## 1. Read the guide

Read `ANIMATION_GUIDE.md` in full before writing any scene code, and look at `docs/emotions.jpg` and `docs/views.jpg`.
The user decides what the video is about; the guide decides how it's made.

## 2. Storyboard, then build

Write `STORYBOARD.md` in the guide's format (logline, world, motif, arc, shots with reads and timing). If the user is
around, show it and wait for a reaction. Then build one shot at a time in `src/scenes/*.js`, listed in `studio.html`.

## 3. Look at every shot

Use the lite renderer: it runs on any machine in about 0.1 s per 1080p frame (no Chrome, no GPU), with the same flags
as `render.mjs`:

```bash
node lite/render.mjs --sheet=0.5,1.2,2.0,2.8 --cols=4 --w=480 --out=out/check/sheet.jpg   # the shape of a shot
node lite/render.mjs --strip=2.1:2.6 --cols=6 --w=320 --out=out/check/strip.jpg          # every frame of a move
node lite/render.mjs --sheet=2.3 --crop=760,420,500,400 --w=500 --out=out/check/face.jpg  # detail
```

Open each image with the Read tool and check it against the guide's review list (reads, timing, motion, boil,
contacts, transitions, no text, no 3D). Fix and look again.

## 4. Render

- `node lite/render.mjs --clip --out=out/video.mp4` renders in parallel on all cores (an 11 s video in about 30 s on
  4 cores). Add `--audio=<file>` for music.
- For p5.brush's real watercolours, render the final cut with the original `node render.mjs --clip` on a machine with
  a GPU (on a CPU it takes tens of seconds per frame). The scene code is the same for both.
- Tell the user where the video is, and what you checked.

## Notes

- `lite/p5lite.js` stands in for p5 + p5.brush on Canvas2D. It covers everything `core.js` uses. If a scene calls
  another p5 function directly (`ellipse`, `noise`, ...), paint it with `paint()`/`inkLine()` instead, as the guide
  says, or add the function to `p5lite.js`.
- `studio.html?lite` scrubs the video in any browser without `npm install`.
