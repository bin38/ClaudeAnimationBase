# The 3-minute "A Life": narration track and bilingual subtitles.
# Input: audio/narration3.wav (the recorded voice-over, 149.75 s) and its machine SRT (audio/narration3_raw.srt).
# The recording already breathes between acts, so it is only shifted LEAD s later (the film opens on a glow before the
# first word) and padded with TAIL s for the last image. Subtitle text is corrected (capitals, punctuation, "andthen",
# "100 times") and gets a Chinese line; "no one can answer who am I" is split at its pause (39.88 s / 41.33 s).
#   assets/life3_narration.mp3   the narration on the video's clock
#   script/life3_subtitles.srt   English + Chinese
import subprocess

LEAD, TAIL, AUDIO = 1.5, 4.5, 149.75
DUR = LEAD + AUDIO + TAIL

# (start, end) in the recording, English, Chinese
LINES = [
  (0.200, 1.133, "Before you were anyone,", "在你成为任何人之前，"),
  (1.366, 3.266, "you were a small light in the dark.", "你只是黑暗里的一点微光。"),
  (4.400, 5.466, "Nobody asked you.", "没有人问过你，"),
  (5.800, 6.800, "Nobody warned you.", "也没有人提醒过你。"),
  (7.600, 10.200, "One morning, the world simply let you in.", "某个清晨，世界就这样让你进来了。"),
  (12.600, 14.533, "At first, everything is enormous.", "起初，一切都那么巨大。"),
  (15.400, 16.733, "A puddle is an ocean.", "一个水坑就是一片海，"),
  (16.800, 18.333, "A butterfly is a miracle.", "一只蝴蝶就是一个奇迹。"),
  (19.366, 21.600, "You fall down a hundred times a day…", "你一天摔倒一百次……"),
  (22.100, 24.333, "and every single time, you get back up.", "可每一次，你都会爬起来。"),
  (25.300, 26.866, "No one has to teach you that.", "没有人教你，"),
  (27.000, 28.066, "You just know.", "你天生就会。"),
  (30.533, 31.700, "Then they hand you a pencil,", "后来，他们给你一支铅笔、"),
  (31.700, 33.133, "a desk, and a thousand questions.", "一张课桌，还有一千个问题。"),
  (34.133, 35.500, "You learn the answers.", "你学会了答案。"),
  (36.300, 38.300, "But the questions you care about most…", "可你最在乎的那些问题……"),
  (38.933, 39.880, "no one can answer.", "没有人能回答。"),
  (41.330, 41.810, "Who am I?", "我是谁？"),
  (42.000, 42.866, "Where am I going?", "我要去哪里？"),
  (42.933, 44.100, "Does any of this matter?", "这一切有意义吗？"),
  (46.733, 49.066, "And then, one ordinary afternoon,", "然后，在某个平常的午后，"),
  (49.366, 50.700, "someone looks back at you.", "有人回头看了你一眼。"),
  (51.666, 53.266, "Your heart forgets how to behave.", "你的心忘了该怎么跳。"),
  (54.166, 56.066, "You fall in love — clumsy,", "你坠入爱河——笨拙、"),
  (56.300, 57.800, "fast, and completely sure.", "仓促，却无比笃定。"),
  (58.866, 61.400, "For a while, the whole world is only two people wide.", "有一阵子，整个世界只有两个人那么宽。"),
  (64.166, 66.533, "Then the world hands you a hard hat and a heavy load.", "后来，世界递给你一顶安全帽，和一副重担。"),
  (67.466, 68.700, "Bills. Deadlines.", "账单，截止日期，"),
  (69.133, 70.566, "Promises you have to keep.", "必须兑现的承诺。"),
  (71.533, 72.866, "The days get shorter.", "日子越来越短，"),
  (72.900, 74.000, "The worries get longer.", "烦恼越来越长。"),
  (74.966, 77.066, "You fail. You try again.", "你失败了，再试一次，"),
  (77.133, 78.333, "You fail a little better.", "然后失败得好一点。"),
  (79.300, 81.600, "Some nights, you sit in the rain and wonder", "有些夜里，你坐在雨里，想知道"),
  (81.600, 82.900, "where your butterfly went.", "你的那只蝴蝶去了哪里。"),
  (85.533, 88.200, "And then, someone small reaches for your hand.", "直到有一天，一只小小的手拉住了你。"),
  (89.533, 92.000, "They look at the world the way you used to.", "他们看世界的样子，就像当年的你。"),
  (92.866, 94.166, "Every puddle an ocean.", "每个水坑都是海，"),
  (94.366, 95.866, "Every butterfly a miracle.", "每只蝴蝶都是奇迹。"),
  (96.866, 98.533, "And the weight feels lighter,", "重担忽然变轻了，"),
  (98.700, 100.900, "because now you know what it was for.", "因为你终于知道它是为了什么。"),
  (103.500, 106.733, "Time slows down… and somehow moves faster.", "时间慢了下来……却又好像走得更快。"),
  (107.700, 109.066, "The hat gets softer.", "帽子变软了，"),
  (109.100, 110.366, "The steps get shorter.", "脚步变小了。"),
  (111.466, 113.266, "The people you love begin to leave,", "你爱的人开始离开，"),
  (113.400, 115.200, "like lights rising into the sky.", "像一盏盏灯，升上了天空。"),
  (116.666, 118.666, "You don't carry as much anymore.", "你不再背负那么多了。"),
  (119.333, 120.533, "You don't need to.", "也不再需要了。"),
  (121.466, 123.500, "You sit where you once danced, and watch", "你坐在曾经跳舞的地方，"),
  (123.500, 125.133, "someone else chase the butterfly.", "看着别人去追那只蝴蝶。"),
  (128.100, 130.500, "In the end, a life isn't measured in years.", "最后，人的一生不是用年岁来衡量的。"),
  (131.666, 133.466, "It's measured in puddles and pencils,", "而是用水坑和铅笔，"),
  (133.500, 135.300, "in hands held and loads carried…", "用牵过的手和扛过的重担……"),
  (136.133, 138.333, "in the moments you were truly there.", "用那些你真正活过的瞬间。"),
  (139.933, 141.533, "So close your eyes, gently.", "所以，轻轻闭上眼吧。"),
  (143.566, 146.266, "Somewhere, a small light is waking up.", "在某个地方，一点微光正在醒来。"),
  (147.133, 149.500, "And a new morning is just beginning.", "新的清晨，正要开始。"),
]

def stamp(t):
    ms = round(t * 1000); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"

if __name__ == "__main__":
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "audio/narration3.wav", "-af",
                    f"adelay={int(LEAD * 1000)}:all=1,apad=whole_dur={DUR}", "-ac", "1", "-ar", "44100", "-b:a", "192k",
                    "assets/life3_narration.mp3"], check=True)
    rows = [(a + LEAD, b + LEAD, en, zh) for a, b, en, zh in LINES]
    with open("script/life3_subtitles.srt", "w") as f:
        for i, (a, b, en, zh) in enumerate(rows):
            nxt = rows[i + 1][0] if i + 1 < len(rows) else DUR
            f.write(f"{i + 1}\n{stamp(a)} --> {stamp(min(b + .5, nxt - .05))}\n{en}\n{zh}\n\n")
    print(f"duration {DUR:.2f} s, {len(rows)} subtitles")
