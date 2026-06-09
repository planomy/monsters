# Monsterz

A classroom tally tracker inspired by ClassDojo — reward students for moments like turning on their camera to greet you in the morning.

**Live site:** [planomy.github.io/monsters](https://planomy.github.io/monsters)

## Features

- **30 student cards** in a responsive grid with monster avatars
- **Click to tally** — tap a card to +1
- **Shift+click or right-click** to −1
- **Double-click names** to rename students
- **Auto-save** to browser localStorage (with manual Save button)
- **Export** tallies as CSV or JSON
- **Import** JSON backups to restore data
- **Undo** last tally
- **Reset tallies** or full reset to defaults

## Theme

Purple, black, and white — built for the classroom.

## Adding Your Monsters

Upload 2×2 sheets to the Cursor assets folder, then run:

```bash
python3 scripts/process-monsters.py
```

This splits each sheet into four monsters, removes lazy GPT duplicates (slime recolors, crystal clones, etc.), and renumbers `public/monsters/01.png` onward.

**Current count:** 30 unique monsters — full class ready.

## Local Development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

The built site lives in `/docs` on `main` (no GitHub Actions required).

1. Push to `planomy/monsters` on branch `main`
2. In repo **Settings → Pages**, set source to **Deploy from branch**
3. Choose branch `main`, folder `/docs`

To rebuild after changes:

```bash
npm run build
rm -rf docs && cp -r dist docs && touch docs/.nojekyll
```

## Tech Stack

- React + TypeScript + Vite
- LocalStorage persistence
- GitHub Pages hosting
