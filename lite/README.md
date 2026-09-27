# Clawd Lite：轻量运行时

同一套动画代码，换一个更轻的底座。不需要 Chrome、WebGL 和 GPU，1080p 每帧约 0.1 秒，任何机器（包括云端容器和 CI）都能跑。

## 为什么要做这个

原版的技术栈是 **p5.js + p5.brush（WebGL）+ puppeteer 驱动的无头 Chrome + ffmpeg**。画面效果很好，但很重：

- 要装 Chrome；在 Linux 服务器上还要处理 sandbox、`--soft-gl` 和 ANGLE 这类参数
- p5.brush 的水彩填充依赖 GPU，没有 GPU 时每帧要几十秒
- 每次检查画面（contact sheet、strip）都要启动浏览器

在同一台 4 核、无 GPU 的机器上实测 11 秒的 demo：

| | 原版（Chrome + `--soft-gl`） | Lite |
|---|---|---|
| 单帧（1080p） | 约 44 秒 | 约 0.1 秒 |
| 整片 264 帧 | 约 3 小时（估算） | 30 秒（3 个 worker 并行） |
| 依赖 | p5、p5.brush、puppeteer-core、Chrome、ffmpeg | `@napi-rs/canvas`（预编译）、ffmpeg（自带 `ffmpeg-static`） |

## 思路：只换底座，不动上层

```
你的场景 src/scenes/*.js          ← 不变
角色 clawd.js / 时间线 timeline.js  ← 不变
引擎 core.js（paint、glow、camera…）← 不变
──────────────────────────────────
p5 + p5.brush（WebGL）  →  lite/p5lite.js（Canvas2D，约 300 行）
Chrome + puppeteer      →  lite/render.mjs（Node + Skia，worker 线程并行）
```

`p5lite.js` 只实现 `core.js` 实际用到的那部分 p5 和 p5.brush API：

- **p5**：`push`/`pop`/`translate`/`rotate`/`scale`、WEBGL 的居中原点、带种子的 `random()`、带 tint 和 ADD 混合的 `image()`（用于 `glow()`），以及 `createGraphics`
- **p5.brush**：会变粗变细的锥形墨线、多层半透明水彩（边缘加深并带晕染）、平涂 wash、排线 hatch、干笔 dry brush

每个笔触只从 `random()` 取一个值作为自己的种子，所以 `boilSeed()` 和每秒 12 次的线条抖动（boil）行为与原版一致：静止的东西在同一个 boil 帧内完全不动。

因为上层代码没改，原仓库以后更新角色、表情或引擎，直接合并就行，Lite 自动跟上。

## 怎么用

```bash
npm install --prefix lite           # 只装一个依赖和 ffmpeg

# 检查画面（参数和 render.mjs 完全一样，ANIMATION_GUIDE.md 里的检查流程照用）
node lite/render.mjs --sheet=0.5,1.5,2.5 --cols=3 --w=640 --out=out/check/sheet.jpg
node lite/render.mjs --strip=2.8:3.2 --cols=5 --w=384 --out=out/check/strip.jpg
node lite/render.mjs --strip=2.8:3.2 --crop-at=760,650,700,500 --out=out/check/follow.jpg
node lite/render.mjs --loop=emotions --sheet=1 --cols=1 --w=1920 --out=out/emotions.jpg

# 出片
node lite/render.mjs --clip --out=out/video.mp4              # 按 CPU 核数并行
node lite/render.mjs --clip --audio=assets/song.mp3 --out=out/video.mp4
node lite/render.mjs --frames && node lite/render.mjs --encode   # 长片：可断点续渲
```

在浏览器里拖动时间轴：直接打开 `studio.html?lite`，不需要 `npm install`，也不需要 GPU。

`lite/render.mjs` 会读取 `studio.html` 里的 `<script src>` 列表来决定加载哪些场景，所以只维护一份列表。

## 复用：每个视频一个项目，任何会话都能调用

**1. 一条命令起一个新项目**

```bash
node lite/new.mjs ../butterfly --duration=15 --bpm=110
cd ../butterfly && npm run setup && npm run sheet
```

新项目带齐引擎、角色、指南、模型表、Lite 运行时和 skill，场景从 `src/scenes/main.js` 模板开始（demo 放在 `reference/` 里作参考）。加 `--full` 会同时带上原版的 Chrome 渲染器，方便在有 GPU 的机器上出最终的水彩版。

**2. Claude Code skill**

仓库里的 `.claude/skills/clawd-animate/SKILL.md` 把整套流程写成了 skill：读指南、写分镜、逐个镜头制作、用 Lite 看 contact sheet、出片。在这个仓库（或 `new.mjs` 生成的项目）里直接说「做一个 15 秒的 Clawd 抓蝴蝶视频」，它就会按这套流程走。

想在所有项目里都能用，把它复制到用户级目录：

```bash
mkdir -p ~/.claude/skills && cp -r .claude/skills/clawd-animate ~/.claude/skills/
```

这样在其他目录提出动画需求时，它会先用 `new.mjs` 建项目（本地没有这套工具时会先 clone 这个仓库）。

## 取舍

- **画面是近似**：p5.brush 按颜料方式混色（黄色叠在蓝色上会变绿），Lite 用的是普通透明度叠加，大面积水彩会稍亮、稍平。轮廓、角色、表情、镜头和转场与原版几乎一致。对比图见 [docs/lite_compare.jpg](../docs/lite_compare.jpg)：上排是原版，下排是 Lite，时间点相同。
- **只覆盖 `core.js` 用到的 API**：场景里如果直接调用了别的 p5 函数（`ellipse`、`noise`…），按指南要求改用 `paint()`/`inkLine()`，或者在 `p5lite.js` 里补上对应函数。
- **推荐分工**：用 Lite 做全部迭代和检查；需要 p5.brush 真水彩时，在有 GPU 的机器上用原版 `render.mjs` 出最终版。两边是同一套场景代码。

## 文件

| 路径 | 作用 |
|---|---|
| `p5lite.js` | Canvas2D 版的 p5 + p5.brush 子集（浏览器和 Node 通用） |
| `render.mjs` | Node 渲染器：contact sheet、strip、裁切、静帧、PNG 序列、MP4；worker 并行 |
| `new.mjs` | 从这套工具新建视频项目 |
| `fonts/` | Permanent Marker 字体（Apache-2.0），Node 下给 `letter()` 和模型表标注用 |
