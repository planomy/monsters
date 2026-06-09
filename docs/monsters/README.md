# Monster Images

Numbered PNGs map to student slots (`01.png` … `30.png`). Recommended size: **256×256px**, transparent background.

## Current status

- **30 unique monsters** installed (slots `01`–`30`) — full class ready

Run dedupe after adding new sheets:

```bash
python3 scripts/process-monsters.py
```

See `manifest.json` for which source image each slot came from and what was removed as a duplicate.
