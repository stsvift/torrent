# EmberTorrent

EmberTorrent is a Windows-focused desktop torrent client prototype with a modern black-and-orange interface. It uses Electron for the desktop shell and WebTorrent as the ready-made torrent engine, so it can add magnet links, torrent URLs, info hashes, and local `.torrent` files.

## Features

- Add torrents from magnet links, info hashes, torrent URLs, or `.torrent` files.
- Choose and open the download folder from the app.
- Pause, resume, and remove torrents from the queue.
- View progress, peer count, ETA, download speed, upload speed, and total downloaded bytes.
- Package a Windows NSIS installer or portable executable with Electron Builder.

## Getting started

```bash
npm install
npm start
```

## Build for Windows

```bash
npm run package:win
```

For Linux-based CI or containers without Wine, build the portable Windows executable with:

```bash
npm run package:win:portable
```

Build artifacts are written to `dist/`.

## Project structure

- `src/main.js` — Electron main process and WebTorrent integration.
- `src/preload.js` — safe IPC bridge exposed to the renderer.
- `src/index.html` — application layout.
- `src/styles.css` — black-and-orange visual design.
- `src/renderer.js` — UI rendering and user interactions.
