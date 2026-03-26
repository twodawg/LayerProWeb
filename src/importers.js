import { applyChromaKeyToBitmap } from "./chroma.js";
import { basenameFromRelativePath, fileToImageBitmap, naturalSortFiles } from "./utils.js";

function isImageFile(file) {
  return typeof file.type === "string" && file.type.startsWith("image/");
}

export async function loadBackgroundFromFile(file) {
  if (!isImageFile(file)) {
    throw new Error("Background must be an image file.");
  }

  const bitmap = await fileToImageBitmap(file);
  return { name: file.name, bitmap };
}

export function groupFilesByTopFolder(fileList) {
  const groups = new Map();
  const valid = [...fileList].filter(isImageFile);

  for (const file of valid) {
    const folderName = basenameFromRelativePath(file.webkitRelativePath || file.name);
    if (!groups.has(folderName)) {
      groups.set(folderName, []);
    }
    groups.get(folderName).push(file);
  }

  for (const [folderName, files] of groups.entries()) {
    groups.set(folderName, naturalSortFiles(files));
  }

  return groups;
}

export async function createLayerFromFiles({ id, name, files, keyColorRgb, tolerance, onProgress }) {
  const frames = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const bitmap = await fileToImageBitmap(file);
    const keyedCanvas = applyChromaKeyToBitmap(bitmap, keyColorRgb, tolerance);

    frames.push({
      name: file.name,
      originalBitmap: bitmap,
      keyedCanvas,
    });

    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    if ((i + 1) % 8 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return {
    id,
    name,
    frames,
    visible: true,
    transform: {
      x: 0,
      y: 0,
      scale: 1,
    },
    keyColorHex: "#000000",
    keyColorRgb,
    tolerance,
  };
}
