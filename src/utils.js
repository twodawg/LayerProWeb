const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function naturalSortFiles(files) {
  return [...files].sort((a, b) => collator.compare(a.name, b.name));
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const base = normalized.length === 3
    ? normalized.split("").map((ch) => ch + ch).join("")
    : normalized;
  const int = Number.parseInt(base, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fileToImageBitmap(file) {
  return createImageBitmap(file);
}

export function basenameFromRelativePath(path) {
  if (!path) {
    return "Layer";
  }
  const parts = path.split("/").filter(Boolean);
  return parts[0] || "Layer";
}
