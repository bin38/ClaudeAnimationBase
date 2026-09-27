# 《A Life · 一生》—— 如何在自己电脑上运行

## 需要安装
- Node.js 18+、Google Chrome（或 Chromium）、ffmpeg
- Python 3 + numpy（只有重新生成字幕 / 音效时才需要）

```bash
npm install
```

## 文件说明
| 路径 | 内容 |
|---|---|
| `src/scenes/life3.js` | 3 分钟版动画（8 个镜头） |
| `src/scenes/life.js` | 69 秒短版动画（6 个镜头） |
| `src/config.js` | 时长、节拍、音频路径；`lite: true` 表示无 GPU 的轻量模式 |
| `studio.html` | 在 Chrome 里打开可以拖动时间轴预览；里面的 `<script>` 决定用哪个版本 |
| `STORYBOARD3.md` / `STORYBOARD.md` | 3 分钟版 / 短版的分镜 |
| `script/LIFE_3MIN_SCRIPT.md` | 3 分钟版文案（中英对照 + 画面说明） |
| `script/build_timeline3.py` | 修正 SRT、加中文、生成对齐的旁白音轨 |
| `script/sfx3.py` | 用代码合成所有音效和环境声，并和旁白混音 |
| `script/life3_subtitles.srt` | 3 分钟版中英双语字幕 |
| `audio/` | 原始配音和原始 SRT |
| `assets/` | 对齐后的旁白、音效轨、混音轨 |

## 重新生成 3 分钟版
```bash
python3 script/build_timeline3.py      # 字幕 + 旁白音轨
python3 script/sfx3.py                 # 音效 + 混音（assets/life3_mix.wav）

# 渲染画面（有独立显卡的电脑去掉 --soft-gl，并把 config.js 里的 lite 改成 false，就有完整水彩效果）
node render.mjs --soft-gl --frames --fps=12 --workers=4
node render.mjs --encode --fps=12 --audio=assets/life3_mix.wav --out=out/a_life_3min.mp4

# 烧进中英字幕（需要系统里有中文字体，比如 文泉驿正黑 / 微软雅黑）
ffmpeg -i out/a_life_3min.mp4 -vf "subtitles=script/life3_subtitles.srt:force_style='FontName=WenQuanYi Zen Hei,FontSize=15,Outline=1.6'" -c:a copy out/a_life_3min_subtitled.mp4
```

预览某几秒而不渲染整片：
```bash
node render.mjs --sheet=10,30,60,90 --cols=4 --out=out/check/sheet.jpg
```

## 换成 69 秒短版
- `studio.html` 里把 `life3.js` 改成 `life.js`
- `src/config.js` 里改成 `duration: 69.32` 和 `audio: 'assets/life_narration.mp3'`
