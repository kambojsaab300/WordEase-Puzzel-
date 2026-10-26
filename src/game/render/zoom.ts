// Zoom and pan for big grids on small phones. Content is drawn with
// translate(tx, ty) then scale(s), from the top-left of the grid view.
// These run on the UI thread during a pinch ('worklet').

export type Zoom = { scale: number; tx: number; ty: number };

export const NO_ZOOM: Zoom = { scale: 1, tx: 0, ty: 0 };

/** Flow: cells below 40 / 48 / 56 dp (Normal / Large / Huge) are too small, so zoom opens. */
export const MIN_CELL = [40, 48, 56] as const;

export function needsZoom(fitCell: number, minCell: number): boolean {
  return fitCell < minCell;
}

/** Enough to reach the comfortable cell size, with a little extra. */
export function maxZoomFor(fitCell: number, minCell: number): number {
  return needsZoom(fitCell, minCell) ? Math.max(1.5, (minCell / fitCell) * 1.25) : 1;
}

/** Keeps the scale in [1, max] and the grid covering the whole view (no empty edges). */
export function clampZoom(z: Zoom, viewW: number, viewH: number, maxScale: number): Zoom {
  'worklet';
  const scale = Math.min(maxScale, Math.max(1, z.scale));
  const tx = Math.min(0, Math.max(viewW - viewW * scale, z.tx));
  const ty = Math.min(0, Math.max(viewH - viewH * scale, z.ty));
  return { scale, tx, ty };
}

/**
 * Pinch: the grid point that was under the fingers at the start stays under the
 * fingers as they spread and move (so two fingers both zoom and pan).
 */
export function pinchZoom(
  start: Zoom,
  startFocal: { x: number; y: number },
  factor: number,
  focal: { x: number; y: number },
  viewW: number,
  viewH: number,
  maxScale: number,
): Zoom {
  'worklet';
  const scale = Math.min(maxScale, Math.max(1, start.scale * factor));
  const contentX = (startFocal.x - start.tx) / start.scale;
  const contentY = (startFocal.y - start.ty) / start.scale;
  return clampZoom({ scale, tx: focal.x - contentX * scale, ty: focal.y - contentY * scale }, viewW, viewH, maxScale);
}

/** Zoom buttons: scale by `factor` around the middle of the view. */
export function zoomAroundCenter(z: Zoom, factor: number, viewW: number, viewH: number, maxScale: number): Zoom {
  const c = { x: viewW / 2, y: viewH / 2 };
  return pinchZoom(z, c, factor, c, viewW, viewH, maxScale);
}

/** Converts a touch on the view into grid coordinates. */
export function toContent(x: number, y: number, z: Zoom): { x: number; y: number } {
  'worklet';
  return { x: (x - z.tx) / z.scale, y: (y - z.ty) / z.scale };
}
