from PIL import Image, ImageDraw, ImageFont
import os
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

W, H = 1200, 630
SLATE900 = (15, 23, 42)
SLATE600 = (71, 85, 105)
SLATE400 = (148, 163, 184)
SLATE100 = (241, 245, 249)
BLUE = (37, 99, 235)
WHITE = (255, 255, 255)
BLEU = (30, 90, 168)
ROUGE = (224, 57, 75)

S_DIR = "/System/Library/Fonts/Supplemental/"
def font(candidates, size):
    for c in candidates:
        p = c if c.startswith("/") else S_DIR + c
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

f_black = lambda s: font(["Arial Black.ttf", "Arial Bold.ttf"], s)
f_bold  = lambda s: font(["Arial Bold.ttf", "Arial Black.ttf"], s)
f_reg   = lambda s: font(["Arial.ttf", "Arial Narrow.ttf", "/System/Library/Fonts/Helvetica.ttc"], s)

img = Image.new("RGB", (W, H), WHITE)
d = ImageDraw.Draw(img)

# subtle top accent strip
d.rectangle([0, 0, W, 8], fill=BLUE)

PAD = 80

# --- logo mark: rounded tricolor square ---
MS = 70
mark = Image.new("RGBA", (MS, MS), (0, 0, 0, 0))
md = ImageDraw.Draw(mark)
b = MS / 3
md.rectangle([0, 0, b, MS], fill=BLEU)
md.rectangle([b, 0, 2*b, MS], fill=WHITE)
md.rectangle([2*b, 0, MS, MS], fill=ROUGE)
mask = Image.new("L", (MS, MS), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, MS-1, MS-1], radius=16, fill=255)
mark.putalpha(mask)
img.paste(mark, (PAD, 60), mark)
# thin border on mark
d.rounded_rectangle([PAD, 60, PAD+MS-1, 60+MS-1], radius=16, outline=(220, 225, 232), width=2)

# wordmark
wx = PAD + MS + 22
d.text((wx, 74), "coucou", font=f_bold(46), fill=SLATE900)
ww = d.textlength("coucou", font=f_bold(46))
d.text((wx + ww + 16, 84), "· learn French", font=f_reg(30), fill=BLUE)

# --- headline ---
hl = f_black(86)
d.text((PAD, 200), "Learn French,", font=hl, fill=SLATE900)
d.text((PAD, 296), "the smart way.", font=hl, fill=SLATE900)
# blue underline under second line
lw = d.textlength("the smart way.", font=hl)
d.rounded_rectangle([PAD, 396, PAD + lw, 404], radius=4, fill=BLUE)

# --- subhead ---
d.text((PAD, 436), "A free, AI-powered playbook for English speakers.", font=f_reg(32), fill=SLATE600)

# --- CEFR chips ---
def chip(x, y, label, bg, fg):
    fnt = f_bold(26)
    tw = d.textlength(label, font=fnt)
    w = tw + 36
    d.rounded_rectangle([x, y, x + w, y + 46], radius=23, fill=bg)
    d.text((x + 18, y + 8), label, font=fnt, fill=fg)
    return x + w + 14

cx = PAD; cy = 512
for lab in ["A1", "A2", "B1"]:
    cx = chip(cx, cy, lab, SLATE100, SLATE600)
cx = chip(cx, cy, "B2", BLUE, WHITE)
d.text((cx + 6, cy + 12), "the level for citizenship", font=f_reg(24), fill=SLATE400)

# --- url ---
d.text((PAD, 574), "ektasengar.github.io/coucou", font=f_bold(26), fill=SLATE400)

out = os.path.join(SITE, "assets/og.png")
img.save(out, "PNG")
print("saved", out, os.path.getsize(out), "bytes")
