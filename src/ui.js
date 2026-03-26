export function getElements() {
  return {
    backgroundInput: document.getElementById("backgroundInput"),
    overlayFolderInput: document.getElementById("overlayFolderInput"),
    status: document.getElementById("status"),
    layerList: document.getElementById("layerList"),
    canvas: document.getElementById("previewCanvas"),
    playPauseBtn: document.getElementById("playPauseBtn"),
    fpsInput: document.getElementById("fpsInput"),
    frameSlider: document.getElementById("frameSlider"),
    frameLabel: document.getElementById("frameLabel"),
    sceneScaleInput: document.getElementById("sceneScaleInput"),
    inspectorEmpty: document.getElementById("inspectorEmpty"),
    inspectorControls: document.getElementById("inspectorControls"),
    selectedLayerName: document.getElementById("selectedLayerName"),
    xInput: document.getElementById("xInput"),
    yInput: document.getElementById("yInput"),
    scaleInput: document.getElementById("scaleInput"),
    visibleInput: document.getElementById("visibleInput"),
    keyColorInput: document.getElementById("keyColorInput"),
    toleranceInput: document.getElementById("toleranceInput"),
    toleranceValue: document.getElementById("toleranceValue"),
    moveLayerUpBtn: document.getElementById("moveLayerUpBtn"),
    moveLayerDownBtn: document.getElementById("moveLayerDownBtn"),
    deleteLayerBtn: document.getElementById("deleteLayerBtn"),
    exportStillBtn: document.getElementById("exportStillBtn"),
    sequenceFramesInput: document.getElementById("sequenceFramesInput"),
    exportSequenceBtn: document.getElementById("exportSequenceBtn"),
  };
}

export function setStatus(elements, text) {
  elements.status.textContent = text;
}

export function renderLayerList(elements, state, onSelect, onToggleVisibility, onDelete) {
  elements.layerList.innerHTML = "";

  if (state.layers.length === 0) {
    elements.layerList.innerHTML = "<p>No overlay layers yet.</p>";
    return;
  }

  for (const layer of state.layers) {
    const row = document.createElement("div");
    row.className = `layer-item ${layer.id === state.selectedLayerId ? "active" : ""}`;

    const visibility = document.createElement("input");
    visibility.type = "checkbox";
    visibility.checked = layer.visible;
    visibility.addEventListener("change", () => onToggleVisibility(layer.id, visibility.checked));

    const info = document.createElement("button");
    info.type = "button";
    info.className = "layer-info";
    info.innerHTML = `<div class="layer-name">${layer.name}</div><div class="layer-frames">${layer.frames.length} frames</div>`;
    info.addEventListener("click", () => onSelect(layer.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "layer-delete danger";
    deleteBtn.textContent = "\u00D7";
    deleteBtn.title = "Delete layer";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onDelete(layer.id);
    });

    const orderBadge = document.createElement("span");
    orderBadge.className = "mono";
    orderBadge.textContent = String(state.layers.indexOf(layer) + 1);

    row.append(visibility, info, deleteBtn, orderBadge);
    elements.layerList.appendChild(row);
  }
}

export function renderInspector(elements, selectedLayer) {
  if (!selectedLayer) {
    elements.inspectorEmpty.classList.remove("hidden");
    elements.inspectorControls.classList.add("hidden");
    return;
  }

  elements.inspectorEmpty.classList.add("hidden");
  elements.inspectorControls.classList.remove("hidden");

  elements.selectedLayerName.textContent = selectedLayer.name;
  elements.xInput.value = String(selectedLayer.transform.x);
  elements.yInput.value = String(selectedLayer.transform.y);
  elements.scaleInput.value = String(selectedLayer.transform.scale);
  elements.visibleInput.checked = selectedLayer.visible;
  elements.keyColorInput.value = selectedLayer.keyColorHex;
  elements.toleranceInput.value = String(selectedLayer.tolerance);
  elements.toleranceValue.value = String(selectedLayer.tolerance);
}

export function renderPlayback(elements, frameIndex, maxFrames, isPlaying) {
  elements.frameSlider.max = String(Math.max(0, maxFrames - 1));
  elements.frameSlider.value = String(Math.min(frameIndex, Math.max(0, maxFrames - 1)));
  elements.frameLabel.textContent = `${Math.min(frameIndex + 1, maxFrames)} / ${maxFrames}`;
  elements.playPauseBtn.textContent = isPlaying ? "Pause" : "Play";

  if (Number(elements.sequenceFramesInput.value) < 1) {
    elements.sequenceFramesInput.value = String(maxFrames);
  }
}
