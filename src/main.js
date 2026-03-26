import { reprocessLayerFrames } from "./chroma.js";
import { exportPngSequenceZip, exportStillFrame } from "./export.js";
import { createLayerFromFiles, groupFilesByTopFolder, loadBackgroundFromFile } from "./importers.js";
import { createPlaybackController, drawCompositeToContext, resizePreviewCanvas } from "./renderer.js";
import { getMaxFrames, getSelectedLayer, nextLayerId, state } from "./state.js";
import { clamp, hexToRgb } from "./utils.js";
import { getElements, renderInspector, renderLayerList, renderPlayback, setStatus } from "./ui.js";

const elements = getElements();
const ctx = elements.canvas.getContext("2d");

const playback = createPlaybackController(
  state,
  () => renderPreview(),
  (frameIndex, maxFrames) => renderPlayback(elements, frameIndex, maxFrames, state.playback.isPlaying),
);

function renderPreview() {
  drawCompositeToContext(ctx, state, state.playback.frameIndex);
}

function rerenderAll() {
  const maxFrames = getMaxFrames();
  state.playback.frameIndex = clamp(state.playback.frameIndex, 0, Math.max(0, maxFrames - 1));
  renderLayerList(elements, state, handleSelectLayer, handleToggleLayerVisibility, handleDeleteLayer);
  renderInspector(elements, getSelectedLayer());
  renderPlayback(elements, state.playback.frameIndex, maxFrames, state.playback.isPlaying);
  renderPreview();
}

function handleSelectLayer(layerId) {
  state.selectedLayerId = layerId;
  rerenderAll();
}

function handleToggleLayerVisibility(layerId, nextVisible) {
  const layer = state.layers.find((entry) => entry.id === layerId);
  if (!layer) {
    return;
  }
  layer.visible = nextVisible;
  rerenderAll();
}

async function onBackgroundImport(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    setStatus(elements, "Loading background...");
    state.background = await loadBackgroundFromFile(file);
    resizePreviewCanvas(elements.canvas, state);
    setStatus(elements, `Background loaded: ${file.name}`);
    rerenderAll();
  } catch (error) {
    setStatus(elements, error.message || "Failed to load background.");
  } finally {
    elements.backgroundInput.value = "";
  }
}

async function onOverlayFolderImport(event) {
  const files = event.target.files;
  if (!files || files.length === 0) {
    return;
  }

  const groups = groupFilesByTopFolder(files);
  if (groups.size === 0) {
    setStatus(elements, "No image files found in selected folder(s).");
    elements.overlayFolderInput.value = "";
    return;
  }

  let groupIndex = 0;
  for (const [folderName, folderFiles] of groups.entries()) {
    groupIndex += 1;
    setStatus(elements, `Importing ${folderName} (${groupIndex}/${groups.size})...`);

    const layer = await createLayerFromFiles({
      id: nextLayerId(),
      name: folderName,
      files: folderFiles,
      keyColorRgb: { r: 0, g: 0, b: 0 },
      tolerance: 30,
      onProgress(current, total) {
        setStatus(elements, `Keying ${folderName}: ${current}/${total}`);
      },
    });

    state.layers.push(layer);
    state.selectedLayerId = layer.id;
  }

  const maxFrames = getMaxFrames();
  elements.sequenceFramesInput.value = String(maxFrames);
  setStatus(elements, `Imported ${groups.size} layer folder(s).`);
  rerenderAll();
  elements.overlayFolderInput.value = "";
}

function updateSelectedLayerTransform() {
  const layer = getSelectedLayer();
  if (!layer) {
    return;
  }

  layer.transform.x = Number(elements.xInput.value) || 0;
  layer.transform.y = Number(elements.yInput.value) || 0;
  layer.transform.scale = Math.max(0.01, Number(elements.scaleInput.value) || 1);
  rerenderAll();
}

function updateSelectedLayerVisibility() {
  const layer = getSelectedLayer();
  if (!layer) {
    return;
  }
  layer.visible = elements.visibleInput.checked;
  rerenderAll();
}

let reprocessDebounceToken = 0;

async function rekeySelectedLayer() {
  const layer = getSelectedLayer();
  if (!layer) {
    return;
  }

  const token = ++reprocessDebounceToken;
  layer.keyColorHex = elements.keyColorInput.value;
  layer.keyColorRgb = hexToRgb(layer.keyColorHex);
  layer.tolerance = Number(elements.toleranceInput.value) || 0;
  elements.toleranceValue.value = String(layer.tolerance);

  setStatus(elements, `Re-keying ${layer.name}...`);
  await reprocessLayerFrames(layer, (current, total) => {
    if (token !== reprocessDebounceToken) {
      return;
    }
    setStatus(elements, `Re-keying ${layer.name}: ${current}/${total}`);
  });

  if (token === reprocessDebounceToken) {
    setStatus(elements, `Updated keying for ${layer.name}.`);
    rerenderAll();
  }
}

function moveSelectedLayer(direction) {
  const layer = getSelectedLayer();
  if (!layer) {
    return;
  }

  const index = state.layers.findIndex((entry) => entry.id === layer.id);
  if (index < 0) {
    return;
  }

  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= state.layers.length) {
    return;
  }

  [state.layers[index], state.layers[nextIndex]] = [state.layers[nextIndex], state.layers[index]];
  rerenderAll();
}

function deleteLayerById(layerId) {
  const index = state.layers.findIndex((entry) => entry.id === layerId);
  if (index < 0) {
    return;
  }

  const name = state.layers[index].name;
  state.layers.splice(index, 1);

  if (state.selectedLayerId === layerId) {
    state.selectedLayerId = state.layers[index]?.id || state.layers[index - 1]?.id || null;
  }

  setStatus(elements, `Deleted layer ${name}.`);
  rerenderAll();
}

function deleteSelectedLayer() {
  const layer = getSelectedLayer();
  if (!layer) {
    return;
  }
  deleteLayerById(layer.id);
}

function handleDeleteLayer(layerId) {
  deleteLayerById(layerId);
}

function togglePlayback() {
  if (state.playback.isPlaying) {
    playback.stop();
    rerenderAll();
  } else {
    playback.start();
    rerenderAll();
  }
}

function updatePlaybackFrame() {
  const maxFrames = getMaxFrames();
  state.playback.frameIndex = clamp(Number(elements.frameSlider.value) || 0, 0, Math.max(0, maxFrames - 1));
  renderPlayback(elements, state.playback.frameIndex, maxFrames, state.playback.isPlaying);
  renderPreview();
}

function updateSceneScale() {
  state.sceneScale = clamp(Number(elements.sceneScaleInput.value) || 1, 0.05, 5);
  resizePreviewCanvas(elements.canvas, state);
  rerenderAll();
}

function updateFps() {
  state.playback.fps = clamp(Number(elements.fpsInput.value) || 24, 1, 60);
  elements.fpsInput.value = String(state.playback.fps);
}

async function handleExportStill() {
  try {
    setStatus(elements, "Exporting still frame...");
    await exportStillFrame(state, elements.canvas, state.playback.frameIndex);
    setStatus(elements, "Still frame exported.");
  } catch (error) {
    setStatus(elements, error.message || "Still export failed.");
  }
}

async function handleExportSequence() {
  const totalFrames = Math.max(1, Number(elements.sequenceFramesInput.value) || getMaxFrames());
  elements.sequenceFramesInput.value = String(totalFrames);

  try {
    setStatus(elements, "Exporting PNG sequence...");
    await exportPngSequenceZip(state, elements.canvas, totalFrames, (current, total) => {
      setStatus(elements, `Exporting PNG sequence: ${current}/${total}`);
    });
    setStatus(elements, "PNG sequence ZIP exported.");
  } catch (error) {
    setStatus(elements, error.message || "Sequence export failed.");
  }
}

function bindEvents() {
  elements.backgroundInput.addEventListener("change", onBackgroundImport);
  elements.overlayFolderInput.addEventListener("change", onOverlayFolderImport);

  elements.xInput.addEventListener("input", updateSelectedLayerTransform);
  elements.yInput.addEventListener("input", updateSelectedLayerTransform);
  elements.scaleInput.addEventListener("input", updateSelectedLayerTransform);
  elements.visibleInput.addEventListener("change", updateSelectedLayerVisibility);

  elements.keyColorInput.addEventListener("input", rekeySelectedLayer);
  elements.toleranceInput.addEventListener("input", rekeySelectedLayer);

  elements.moveLayerUpBtn.addEventListener("click", () => moveSelectedLayer(1));
  elements.moveLayerDownBtn.addEventListener("click", () => moveSelectedLayer(-1));
  elements.deleteLayerBtn.addEventListener("click", deleteSelectedLayer);

  elements.playPauseBtn.addEventListener("click", togglePlayback);
  elements.frameSlider.addEventListener("input", updatePlaybackFrame);
  elements.sceneScaleInput.addEventListener("input", updateSceneScale);
  elements.fpsInput.addEventListener("change", updateFps);

  elements.exportStillBtn.addEventListener("click", handleExportStill);
  elements.exportSequenceBtn.addEventListener("click", handleExportSequence);
}

function init() {
  bindEvents();
  updateFps();
  rerenderAll();
}

init();
