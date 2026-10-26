// Zoom and pan for the flat world map. The map is `mapW` x `mapH` inside a view
// `viewW` x `viewH`; content is drawn with translate(tx, ty) then scale(s).
// These run on the UI thread during gestures ('worklet').

export type MapCamera = { scale: number; tx: number; ty: number };

export const MAP_MAX_ZOOM = 4;
export const FOCUS_ZOOM = 2.4;

type Box = { viewW: number; viewH: number; mapW: number; mapH: number };

/** Keeps the map filling the view where it can, and centred where it is smaller. */
export function clampCamera(c: MapCamera, b: Box): MapCamera {
  'worklet';
  const scale = Math.min(MAP_MAX_ZOOM, Math.max(1, c.scale));
  const w = b.mapW * scale;
  const h = b.mapH * scale;
  const tx = w <= b.viewW ? (b.viewW - w) / 2 : Math.min(0, Math.max(b.viewW - w, c.tx));
  const ty = h <= b.viewH ? (b.viewH - h) / 2 : Math.min(0, Math.max(b.viewH - h, c.ty));
  return { scale, tx, ty };
}

/** The whole map, centred. */
export function homeCamera(b: Box): MapCamera {
  'worklet';
  return clampCamera({ scale: 1, tx: 0, ty: 0 }, b);
}

/** Zoomed in with the map point (px, py) in the middle of the view. */
export function focusCamera(px: number, py: number, scale: number, b: Box): MapCamera {
  'worklet';
  return clampCamera({ scale, tx: b.viewW / 2 - px * scale, ty: b.viewH / 2 - py * scale }, b);
}

/** Pinch: the map point under the fingers stays under them while they spread and move. */
export function pinchCamera(
  start: MapCamera,
  startFocal: { x: number; y: number },
  factor: number,
  focal: { x: number; y: number },
  b: Box,
): MapCamera {
  'worklet';
  const scale = Math.min(MAP_MAX_ZOOM, Math.max(1, start.scale * factor));
  const mx = (startFocal.x - start.tx) / start.scale;
  const my = (startFocal.y - start.ty) / start.scale;
  return clampCamera({ scale, tx: focal.x - mx * scale, ty: focal.y - my * scale }, b);
}

/** Where a map point appears on screen. */
export function onScreen(px: number, py: number, c: MapCamera): { x: number; y: number } {
  'worklet';
  return { x: c.tx + px * c.scale, y: c.ty + py * c.scale };
}
