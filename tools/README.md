# tools/

Build scripts for the Coucou site. All paths are resolved relative to this
file, so you can run them from anywhere — including a fresh clone.

| Script | What it does | Needs |
| --- | --- | --- |
| `build_audio.py` | Generates the neural French audio under `assets/audio/tts/`. Skips clips that already exist, so a rerun only makes what's new. | `pip3 install --user edge-tts`, plus `ffmpeg` for the two-voice dialogues |
| `serve.js` | Local dev server for the site on port 8766. | node |
| `build_og.py` | Regenerates `assets/og.png`, the social share card. | `pillow` |
| `build_tracker.py` | Regenerates `assets/French_Learning_Tracker.xlsx`. | `openpyxl` |

```bash
python3 site/tools/build_audio.py
```

```bash
node site/tools/serve.js
```

## Careful: `clean()` is mirrored in four places

Lesson audio is content-addressed. A French string is normalised, then
djb2-hashed into `assets/audio/tts/say/<hash>.mp3`, and the browser computes
that same hash at play time to find the file. There is no manifest — the hash
*is* the link.

So the normalisation must be byte-identical in all four copies:

- `build_audio.py` — `clean()`
- `lesson.html` — inside `speak()`
- `lessons.html` — inside `speak()`
- `practice.html` — inside `speak()`

Currently it drops `(parentheticals)` and turns `/` and `→` into `, `.

If the copies drift, nothing errors. The browser just requests a hash that was
never generated, and the audio silently stops working for the affected strings.
After changing it, rerun `build_audio.py` — old clips are orphaned rather than
overwritten, so also check that every string still resolves before committing.
