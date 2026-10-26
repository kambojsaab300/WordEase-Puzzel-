// Orthographic projection for the 3D globe. Everything here runs on the UI thread
// ('worklet'), so dragging the globe never waits for JavaScript.
//
// yaw   = longitude (radians) at the centre of the view
// pitch = latitude (radians) at the centre of the view
// r     = globe radius in dp; (cx, cy) = globe centre on screen

export const DEG = Math.PI / 180;
export const MAX_PITCH = 1.35; // ~77°, enough to look at Antarctica

// Anything with moveTo/lineTo/close: a Skia path on the phone, a recorder in tests
export type PathSink = {
  moveTo: (x: number, y: number) => unknown;
  lineTo: (x: number, y: number) => unknown;
  close: () => unknown;
};

export type View = { yaw: number; pitch: number; r: number; cx: number; cy: number };

// A ring of [lon, lat] points with the trigonometry that never changes precomputed
export type PreparedRing = { lon: number[]; sinLat: number[]; cosLat: number[] };

export function prepareRings(rings: number[][]): PreparedRing[] {
  return rings.map(flat => {
    const lon: number[] = [];
    const sinLat: number[] = [];
    const cosLat: number[] = [];
    for (let i = 0; i < flat.length; i += 2) {
      lon.push(flat[i] * DEG);
      sinLat.push(Math.sin(flat[i + 1] * DEG));
      cosLat.push(Math.cos(flat[i + 1] * DEG));
    }
    return { lon, sinLat, cosLat };
  });
}

/** Screen position of a lon/lat (degrees); `visible` is false on the far side. */
export function project(lonDeg: number, latDeg: number, v: View): { x: number; y: number; visible: boolean; depth: number } {
  'worklet';
  const lam = lonDeg * DEG - v.yaw;
  const phi = latDeg * DEG;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosP = Math.cos(v.pitch);
  const sinP = Math.sin(v.pitch);
  const cosLam = Math.cos(lam);
  const depth = sinP * sinPhi + cosP * cosPhi * cosLam; // cos of distance from the view centre
  return {
    x: v.cx + v.r * cosPhi * Math.sin(lam),
    y: v.cy - v.r * (cosP * sinPhi - sinP * cosPhi * cosLam),
    visible: depth > 0,
    depth,
  };
}

/**
 * Filled land outlines. Points on the far side are pulled onto the rim of the globe,
 * so a coastline that crosses the horizon closes neatly along the edge.
 */
export function appendLand(path: PathSink, rings: PreparedRing[], v: View) {
  'worklet';
  const cosP = Math.cos(v.pitch);
  const sinP = Math.sin(v.pitch);
  for (let k = 0; k < rings.length; k++) {
    const ring = rings[k];
    const n = ring.lon.length;
    let anyVisible = false;
    for (let i = 0; i < n; i++) {
      const cosLam = Math.cos(ring.lon[i] - v.yaw);
      if (sinP * ring.sinLat[i] + cosP * ring.cosLat[i] * cosLam > 0) {
        anyVisible = true;
        break;
      }
    }
    if (!anyVisible) continue;

    for (let i = 0; i < n; i++) {
      const lam = ring.lon[i] - v.yaw;
      const cosLam = Math.cos(lam);
      let x = ring.cosLat[i] * Math.sin(lam);
      let y = cosP * ring.sinLat[i] - sinP * ring.cosLat[i] * cosLam;
      const depth = sinP * ring.sinLat[i] + cosP * ring.cosLat[i] * cosLam;
      if (depth < 0) {
        const len = Math.sqrt(x * x + y * y) || 1;
        x /= len;
        y /= len;
      }
      const sx = v.cx + v.r * x;
      const sy = v.cy - v.r * y;
      if (i === 0) path.moveTo(sx, sy);
      else path.lineTo(sx, sy);
    }
    path.close();
  }
}

// Draws a lon/lat polyline, lifting the pen while it is on the far side
function appendPolyline(path: PathSink, lons: number[], lats: number[], v: View) {
  'worklet';
  let penDown = false;
  for (let i = 0; i < lons.length; i++) {
    const p = project(lons[i], lats[i], v);
    if (!p.visible) {
      penDown = false;
      continue;
    }
    if (penDown) path.lineTo(p.x, p.y);
    else path.moveTo(p.x, p.y);
    penDown = true;
  }
}

/** Latitude and longitude lines every 30°. */
export function appendGraticule(path: PathSink, v: View) {
  'worklet';
  for (let lon = -180; lon < 180; lon += 30) {
    const lons: number[] = [];
    const lats: number[] = [];
    for (let lat = -80; lat <= 80; lat += 4) {
      lons.push(lon);
      lats.push(lat);
    }
    appendPolyline(path, lons, lats, v);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const lons: number[] = [];
    const lats: number[] = [];
    for (let lon = -180; lon <= 180; lon += 4) {
      lons.push(lon);
      lats.push(lat);
    }
    appendPolyline(path, lons, lats, v);
  }
}

/** Great-circle flight path between two places (degrees), visible part only. */
export function appendArc(path: PathSink, from: [number, number], to: [number, number], v: View) {
  'worklet';
  const toVec = (lon: number, lat: number) => [
    Math.cos(lat * DEG) * Math.cos(lon * DEG),
    Math.cos(lat * DEG) * Math.sin(lon * DEG),
    Math.sin(lat * DEG),
  ];
  const a = toVec(from[0], from[1]);
  const b = toVec(to[0], to[1]);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const steps = Math.max(2, Math.ceil(omega / (3 * DEG)));
  const lons: number[] = [];
  const lats: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s = Math.sin(omega);
    const wa = s < 1e-6 ? 1 - t : Math.sin((1 - t) * omega) / s;
    const wb = s < 1e-6 ? t : Math.sin(t * omega) / s;
    const x = wa * a[0] + wb * b[0];
    const y = wa * a[1] + wb * b[1];
    const z = wa * a[2] + wb * b[2];
    lons.push(Math.atan2(y, x) / DEG);
    lats.push(Math.atan2(z, Math.sqrt(x * x + y * y)) / DEG);
  }
  appendPolyline(path, lons, lats, v);
}

/** Target yaw that reaches `targetLonDeg` the short way round from `currentYaw`. */
export function shortestYaw(currentYaw: number, targetLonDeg: number): number {
  'worklet';
  const target = targetLonDeg * DEG;
  let delta = (target - currentYaw) % (2 * Math.PI);
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;
  return currentYaw + delta;
}

export function clampPitch(pitch: number): number {
  'worklet';
  return Math.min(MAX_PITCH, Math.max(-MAX_PITCH, pitch));
}
