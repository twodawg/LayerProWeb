import { clamp } from "./utils.js";

function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function applyChromaKeyToBitmap(bitmap, keyColorRgb, tolerance) {
  const width = bitmap.width;
  const height = bitmap.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const threshold = clamp(Number(tolerance) || 0, 0, 255);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const distance = colorDistance(r, g, b, keyColorRgb.r, keyColorRgb.g, keyColorRgb.b);
    if (distance <= threshold) {
      pixels[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function reprocessLayerFrames(layer, onProgress) {
  const total = layer.frames.length;

  for (let i = 0; i < total; i += 1) {
    const frame = layer.frames[i];
    frame.keyedCanvas = applyChromaKeyToBitmap(frame.originalBitmap, layer.keyColorRgb, layer.tolerance);
    if (onProgress) {
      onProgress(i + 1, total);
    }
    if ((i + 1) % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}
