// Flat world map in the Equal Earth projection (Šavrič, Patterson & Jenny, 2018):
// countries keep their true relative sizes and the outline is a gentle rounded oval.

const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const DEG = Math.PI / 180;

/** Raw Equal Earth coordinates (x right, y up). */
export function equalEarth(lonDeg: number, latDeg: number): [number, number] {
  const lambda = lonDeg * DEG;
  const theta = Math.asin(M * Math.sin(latDeg * DEG));
  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;
  const x = (lambda * Math.cos(theta)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}

// Projection extents for lon ±180°, lat ±90° (exact, so nothing falls outside the map box)
export const MAP_X = equalEarth(180, 0)[0];
export const MAP_Y = equalEarth(0, 90)[1];
export const MAP_ASPECT = MAP_X / MAP_Y; // width / height ≈ 2.05

/** Position on a map drawn `width` wide (height = width / MAP_ASPECT), y down. */
export function toMap(lonDeg: number, latDeg: number, width: number): [number, number] {
  const [x, y] = equalEarth(lonDeg, latDeg);
  const height = width / MAP_ASPECT;
  return [((x + MAP_X) / (2 * MAP_X)) * width, ((MAP_Y - y) / (2 * MAP_Y)) * height];
}

/** SVG path for a set of [lon, lat, lon, lat, ...] rings on a map `width` wide. */
export function ringsToSvg(rings: number[][], width: number): string {
  let d = '';
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i += 2) {
      const [x, y] = toMap(ring[i], ring[i + 1], width);
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    d += 'Z';
  }
  return d;
}

/** The map's outer edge (the oval of the whole Earth) as an SVG path. */
export function outlineSvg(width: number): string {
  const pts: string[] = [];
  for (let lat = -90; lat <= 90; lat += 3) pts.push(toMap(180, lat, width).map(n => n.toFixed(1)).join(' '));
  for (let lat = 90; lat >= -90; lat -= 3) pts.push(toMap(-180, lat, width).map(n => n.toFixed(1)).join(' '));
  return `M${pts.join('L')}Z`;
}

/** Latitude / longitude lines every 30°. */
export function graticuleSvg(width: number): string {
  let d = '';
  for (let lon = -150; lon <= 150; lon += 30) {
    for (let lat = -90; lat <= 90; lat += 5) {
      const [x, y] = toMap(lon, lat, width);
      d += `${lat === -90 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    for (let lon = -180; lon <= 180; lon += 10) {
      const [x, y] = toMap(lon, lat, width);
      d += `${lon === -180 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  return d;
}

/** A gentle arc between two places, like a flight path on a paper map. */
export function routeSvg(points: [number, number][]): string {
  if (points.length < 2) return '';
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const lift = Math.hypot(x1 - x0, y1 - y0) * 0.2;
    d += `Q${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2 - lift).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}
