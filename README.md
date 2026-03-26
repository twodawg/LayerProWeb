# LayerPro Web

Single-page web app for compositing one background image with unlimited keyed overlay sequence folders.

## Features

- One background image upload.
- One or more overlay folders (image sequences) per import, with unlimited total layers.
- Per-layer chroma key using key color (default black) plus tolerance.
- Per-layer transforms: x, y, scale.
- Layer visibility toggle, reorder, and delete.
- Playback with FPS and frame scrubber.
- Export current frame as PNG.
- Export PNG sequence as ZIP.

## Run

No build step is required.

1. Open `index.html` in a modern browser (Chrome or Safari recommended).
2. Upload background image.
3. Upload one or more overlay folders.
4. Select a layer and adjust x/y/scale and key settings.
5. Export still or sequence.

## Notes

- Folder import relies on `webkitdirectory` support.
- Sequence ZIP export uses JSZip loaded from CDN.
