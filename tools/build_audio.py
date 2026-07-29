#!/usr/bin/env python3
"""Generate neural French audio (edge-tts) for Coucou's dictée, shadow,
listening and lesson content. Re-run after editing data/dictee.json,
data/shadow.json, data/lessons.json or the listening items in
data/comprehension.json. Existing files are skipped, so reruns only
generate what's new.

  pip3 install --user edge-tts   ·   needs ffmpeg for dialogue concat
  python3 site/tools/build_audio.py   (paths are script-relative; run from anywhere)

Voices: Denise (F) + Henri (M). Listening texts that start with « — » are
split on speaker turns and voiced as two-person dialogues (Henri asks,
Denise answers), matching the DELF listening format.

Lesson strings (vocab, examples, phonics examples) are content-addressed:
cleaned exactly like the pages' speak() helper, then djb2-hashed into
assets/audio/tts/say/<hash>.mp3 — the same hash the browser computes, so
any page can play any lesson string without a manifest.
"""
import asyncio, json, os, re, subprocess, tempfile
import edge_tts

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.join(SITE, "assets/audio/tts")
DENISE, HENRI = "fr-FR-DeniseNeural", "fr-FR-HenriNeural"

def load(name):
    with open(os.path.join(SITE, "data", name)) as f: return json.load(f)

# Mirror of the pages' speak() cleaning: drop (parentheticals), "/" and "→"
# become a pause. Keep in sync with lesson.html, lessons.html and practice.html
# — the hash is computed from this, so a mismatch silently breaks playback.
def clean(text):
    t = re.sub(r'\([^)]*\)', '', str(text))
    t = re.sub(r'\s*(?:/|→)\s*', ', ', t)
    return re.sub(r'\s+', ' ', t).strip()

# Mirror of the pages' sayHash(): djb2-xor over UTF-16 code units, base 36.
def say_hash(s):
    h = 5381
    for ch in s:
        h = ((h * 33) & 0xFFFFFFFF) ^ ord(ch)
    digits = '0123456789abcdefghijklmnopqrstuvwxyz'
    if h == 0: return '0'
    out = ''
    while h:
        out = digits[h % 36] + out
        h //= 36
    return out

specs, dialogue_parts = [], {}
tmp = tempfile.mkdtemp()

for s in load('dictee.json'):
    os.makedirs(f"{ROOT}/dictee", exist_ok=True)
    for i, sen in enumerate(s['sentences']):
        specs.append((sen['fr'], DENISE, f"{ROOT}/dictee/{s['id']}-{i}.mp3", "-10%"))

for s in load('shadow.json'):
    os.makedirs(f"{ROOT}/shadow", exist_ok=True)
    for i, ph in enumerate(s['phrases']):
        specs.append((ph['fr'], DENISE, f"{ROOT}/shadow/{s['id']}-{i}.mp3", None))

listen = [i for i in load('comprehension.json') if i['skill'] == 'listening']
os.makedirs(f"{ROOT}/listen", exist_ok=True)
mono_voice = [DENISE, HENRI]
for k, it in enumerate(listen):
    txt = it['text'].strip()
    if txt.startswith('—'):
        # Rebuilding a dialogue needs every turn, so only skip when the
        # final concat output already exists.
        if os.path.exists(f"{ROOT}/listen/{it['id']}.mp3"): continue
        parts = []
        for j, turn in enumerate(t.strip() for t in txt.split('—') if t.strip()):
            p = os.path.join(tmp, f"{it['id']}-{j}.mp3")
            parts.append(p)
            specs.append((turn, HENRI if j % 2 == 0 else DENISE, p, None))
        dialogue_parts[it['id']] = parts
    else:
        specs.append((txt, mono_voice[k % 2], f"{ROOT}/listen/{it['id']}.mp3", None))

# Lesson strings → content-addressed clips (vocab, examples, phonics examples).
os.makedirs(f"{ROOT}/say", exist_ok=True)
seen = set()
def add_say(text):
    c = clean(text)
    if not c: return
    h = say_hash(c)
    if h in seen: return
    seen.add(h)
    specs.append((c, DENISE, f"{ROOT}/say/{h}.mp3", "-5%"))

for l in load('lessons.json'):
    for v in l.get('vocab', []): add_say(v['fr'])
    for ex in l.get('examples', []): add_say(ex)
    for ph in l.get('phonics', []):
        for ex in ph.get('examples', []): add_say(ex)

# Landing-page "taste" words on lessons.html — a one-click first win before
# the visitor commits to any lesson. Same content-addressed say/ clips.
for w in ("bonjour", "coucou", "merci"): add_say(w)

# Skip clips that already exist (content-addressed names never go stale).
specs = [s for s in specs if not os.path.exists(s[2])]

async def main():
    sem = asyncio.Semaphore(6)
    async def gen(text, voice, path, rate):
        async with sem:
            kw = {"rate": rate} if rate else {}
            await edge_tts.Communicate(text, voice, **kw).save(path)
    await asyncio.gather(*(gen(*s) for s in specs))

asyncio.run(main())

if dialogue_parts:
    sil = os.path.join(tmp, "sil.mp3")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","lavfi","-i","anullsrc=r=24000:cl=mono","-t","0.55","-b:a","48k",sil], check=True)
    for iid, parts in dialogue_parts.items():
        lst = os.path.join(tmp, f"{iid}.txt")
        with open(lst, "w") as f:
            for j, p in enumerate(parts):
                if j: f.write(f"file '{sil}'\n")
                f.write(f"file '{p}'\n")
        subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",lst,
                        "-c:a","libmp3lame","-b:a","64k","-ar","24000",f"{ROOT}/listen/{iid}.mp3"], check=True)

print(f"generated {len(specs)} new clips → {ROOT}")
