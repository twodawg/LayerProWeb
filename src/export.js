import { drawCompositeToContext } from "./renderer.js";
import { downloadBlob } from "./utils.js";

function getRenderSize(state, fallbackCanvas) {
  if (state.background?.bitmap) {
    return {
      width: state.background.bitmap.width,
      height: state.background.bitmap.height,
    };
  }

  return {
    width: fallbackCanvas.width,
    height: fallbackCanvas.height,
  };
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Unable to produce PNG blob."));
      }
    }, "image/png");
  });
}

function makeOffscreenCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export async function exportStillFrame(state, previewCanvas, frameIndex) {
  const size = getRenderSize(state, previewCanvas);
  const canvas = makeOffscreenCanvas(size.width, size.height);
  const ctx = canvas.getContext("2d");

  const savedScale = state.sceneScale;
  state.sceneScale = 1;
  drawCompositeToContext(ctx, state, frameIndex);
  state.sceneScale = savedScale;

  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, `layerpro_still_${String(frameIndex + 1).padStart(4, "0")}.png`);
}

export async function exportPngSequenceZip(state, previewCanvas, totalFrames, onProgress) {
  if (!window.JSZip) {
    throw new Error("JSZip failed to load.");
  }

  const count = Math.max(1, Number(totalFrames) || 1);
  const size = getRenderSize(state, previewCanvas);
  const canvas = makeOffscreenCanvas(size.width, size.height);
  const ctx = canvas.getContext("2d");
  const zip = new window.JSZip();

  const savedScale = state.sceneScale;
  state.sceneScale = 1;

  for (let i = 0; i < count; i += 1) {
    drawCompositeToContext(ctx, state, i);
    const blob = await canvasToBlob(canvas);
    zip.file(`frame_${String(i + 1).padStart(5, "0")}.png`, blob);

    if (onProgress) {
      onProgress(i + 1, count);
    }

    if ((i + 1) % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  state.sceneScale = savedScale;
  downloadBlob(zipBlob, "layerpro_sequence.zip");
}
