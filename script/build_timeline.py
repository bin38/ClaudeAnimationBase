# Builds the video's narration track and bilingual subtitles from the recorded voice-over.
# The recording (audio/narration.mp3, 56.3 s) is cut into its six acts at the pauses between them; each act is shifted
# later so there is a breath of silence between acts (the picture needs time to land), then everything is written out:
#   assets/life_narration.mp3   the narration on the video's clock
#   script/life_subtitles.srt   English + Chinese, timed to the real speech (recognised with Whisper, split at pauses)
import subprocess

LEAD, GAP, TAIL = 1.5, 1.5, 4.0
# act boundaries in the recording: the middle of the pause between acts
CUTS = [0.0, 4.14, 14.53, 23.31, 38.20, 46.05, 56.32]
OFFS = [LEAD + i * GAP for i in range(6)]            # how far each act moves later
DUR = CUTS[-1] + OFFS[-1] + TAIL

# (start, end) in the recording, English, Chinese
LINES = [
  (0.00, 1.53, "Nobody asks to begin.", "没有人请求开始。"),
  (1.76, 4.05, "One morning, you simply open your eyes.", "某个清晨，你只是睁开了眼睛。"),
  (4.23, 5.74, "At first, everything is new.", "一开始，一切都是新的。"),
  (5.96, 7.34, "Every flower is a wonder.", "每一朵花都是奇迹。"),
  (7.55, 10.00, "Every fall feels like the end of the world…", "每一次跌倒，都像是世界末日……"),
  (10.19, 10.96, "…until it isn't.", "……直到你发现，并不是。"),
  (11.21, 14.37, "And you learn the oldest trick there is: get back up.", "于是你学会了最古老的本事：站起来。"),
  (14.69, 15.54, "Then you grow.", "然后，你长大了。"),
  (15.70, 17.51, "You ask questions no one can answer.", "你问出没人能回答的问题。"),
  (17.55, 19.62, "You fall in love — a little too fast.", "你坠入爱河——有点太快了。"),
  (19.83, 21.15, "You think you'll live forever.", "你以为自己会永远活着。"),
  (21.39, 23.19, "And for a while, you're right.", "有那么一阵子，你是对的。"),
  (23.43, 25.66, "Then the world hands you a hard hat and a heavy load.", "后来，世界递给你一顶安全帽，和一副重担。"),
  (25.85, 26.95, "The days get shorter.", "日子越来越短，"),
  (27.19, 28.38, "The worries get longer.", "烦恼越来越长。"),
  (28.72, 30.58, "You fail. You try again.", "你失败了，再试一次。"),
  (30.77, 32.25, "Some days, you just want to sleep.", "有些日子，你只想睡一觉。"),
  (32.55, 35.28, "And then, someone small reaches for your hand…", "直到有一天，一只小小的手拉住了你……"),
  (35.56, 37.98, "and suddenly, you understand what it was all for.", "你忽然明白了，这一切是为了什么。"),
  (38.45, 41.01, "Time slows down… and somehow moves faster.", "时间慢了下来……却又好像走得更快。"),
  (41.30, 43.14, "The people you love begin to leave.", "你爱的人，开始一个个离开。"),
  (43.43, 44.90, "You don't carry as much anymore.", "你不再背负那么多了。"),
  (44.92, 45.88, "You don't need to.", "也不再需要了。"),
  (46.21, 48.74, "In the end, a life isn't measured in years.", "最后，人的一生不是用年岁来衡量的。"),
  (49.02, 51.27, "It's measured in the moments you were truly there.", "而是用那些你真正活过的瞬间。"),
  (51.53, 53.34, "So close your eyes, gently.", "所以，轻轻闭上眼吧。"),
  (53.63, 56.04, "Somewhere, a new morning is just beginning.", "在某个地方，新的清晨正要开始。"),
]

def shift(t):
    for i in range(6):
        if t < CUTS[i + 1] or i == 5: return t + OFFS[i]

def stamp(t):
    ms = round(t * 1000); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"

if __name__ == "__main__":
    # audio: each act delayed by its offset, mixed onto silence
    parts, labels = [], []
    for i in range(6):
        parts.append(f"[s{i}]atrim={CUTS[i]}:{CUTS[i + 1]},asetpts=PTS-STARTPTS,adelay={int((CUTS[i] + OFFS[i]) * 1000)}:all=1[a{i}]")
        labels.append(f"[a{i}]")
    fc = "[0:a]asplit=6" + "".join(f"[s{i}]" for i in range(6)) + ";" + ";".join(parts) + ";" + "".join(labels) + \
         f"amix=inputs=6:normalize=0:duration=longest,apad=whole_dur={DUR}[out]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/narration.mp3", "-filter_complex", fc, "-map", "[out]",
                    "-ar", "44100", "-c:a", "pcm_s16le", "/tmp/life_narration.wav"], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "/tmp/life_narration.wav", "-b:a", "192k", "assets/life_narration.mp3"], check=True)
    # subtitles: shown from the first word, held a little past the last one (never into the next line)
    rows = [(shift(a), shift(b), en, zh) for a, b, en, zh in LINES]
    with open("script/life_subtitles.srt", "w") as f:
        for i, (a, b, en, zh) in enumerate(rows):
            nxt = rows[i + 1][0] if i + 1 < len(rows) else DUR
            f.write(f"{i + 1}\n{stamp(a)} --> {stamp(min(b + .6, nxt - .05))}\n{en}\n{zh}\n\n")
    print(f"duration {DUR:.2f} s")
    for i in range(6): print(f"act {i}: speech {CUTS[i] + OFFS[i]:.2f}–{CUTS[i + 1] + OFFS[i]:.2f}")
