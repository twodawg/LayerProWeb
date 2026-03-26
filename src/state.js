export const state = {
  background: null,
  layers: [],
  selectedLayerId: null,
  sceneScale: 1,
  playback: {
    isPlaying: false,
    fps: 24,
    frameIndex: 0,
    lastTickTimeMs: 0,
  },
};

let layerCounter = 1;

export function nextLayerId() {
  const id = `layer-${layerCounter}`;
  layerCounter += 1;
  return id;
}

export function getSelectedLayer() {
  return state.layers.find((layer) => layer.id === state.selectedLayerId) || null;
}

export function getMaxFrames() {
  let max = 1;
  for (const layer of state.layers) {
    if (layer.frames.length > max) {
      max = layer.frames.length;
    }
  }
  return max;
}
