import { getMaxFrames } from "./state.js";

function drawBackground(ctx, state) {
  if (state.background && state.background.bitmap) {
    ctx.drawImage(state.background.bitmap, 0, 0);
    return;
  }

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function drawCompositeToContext(ctx, state, frameIndex) {
  const scale = state.sceneScale || 1;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  drawBackground(ctx, state);

  for (const layer of state.layers) {
    if (!layer.visible || layer.frames.length === 0) {
      continue;
    }

    const localIndex = frameIndex % layer.frames.length;
    const frame = layer.frames[localIndex];
    if (!frame || !frame.keyedCanvas) {
      continue;
    }

    ctx.save();
    ctx.translate(layer.transform.x, layer.transform.y);
    ctx.scale(layer.transform.scale, layer.transform.scale);
    ctx.drawImage(frame.keyedCanvas, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

export function resizePreviewCanvas(canvas, state) {
  if (!state.background?.bitmap) {
    return;
  }

  const scale = state.sceneScale || 1;
  const nextWidth = Math.round(state.background.bitmap.width * scale);
  const nextHeight = Math.round(state.background.bitmap.height * scale);

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
}

export function createPlaybackController(state, onRender, onFrameChange) {
  let rafId = null;

  function tick(timestampMs) {
    if (!state.playback.isPlaying) {
      return;
    }

    const frameDurationMs = 1000 / state.playback.fps;
    if (!state.playback.lastTickTimeMs) {
      state.playback.lastTickTimeMs = timestampMs;
    }

    const elapsed = timestampMs - state.playback.lastTickTimeMs;
    if (elapsed >= frameDurationMs) {
      const step = Math.max(1, Math.floor(elapsed / frameDurationMs));
      const maxFrames = getMaxFrames();
      state.playback.frameIndex = (state.playback.frameIndex + step) % maxFrames;
      state.playback.lastTickTimeMs = timestampMs;
      onFrameChange(state.playback.frameIndex, maxFrames);
      onRender();
    }

    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (state.playback.isPlaying) {
        return;
      }
      state.playback.isPlaying = true;
      state.playback.lastTickTimeMs = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      state.playback.isPlaying = false;
      state.playback.lastTickTimeMs = 0;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
