// The 20 World Trip stops: name, paper palette, generic landmark and globe position.
export type LandmarkKind =
  | 'house'
  | 'tower'
  | 'arch'
  | 'windmill'
  | 'pyramid'
  | 'acacia'
  | 'dome'
  | 'pagoda'
  | 'snowpeak'
  | 'wall'
  | 'rock'
  | 'palm'
  | 'cactus'
  | 'peaks'
  | 'jungletree'
  | 'pine'
  | 'skyline'
  | 'volcano'
  | 'castle'
  | 'iceberg';

export type WorldPalette = {
  sky: string;
  far: string;
  mid: string;
  near: string;
  accent: string;
};

export type WorldDef = {
  id: number;
  name: string;
  landmark: LandmarkKind;
  palette: WorldPalette;
  // Real place on Earth for the 3D globe (Home Town is a stand-in countryside spot)
  geo: { lat: number; lon: number };
};

const p = (sky: string, far: string, mid: string, near: string, accent: string): WorldPalette => ({
  sky,
  far,
  mid,
  near,
  accent,
});

export const WORLDS: WorldDef[] = [
  { id: 1, name: 'Home Town', landmark: 'house', palette: p('#FDF1DC', '#CFE3C4', '#A9CF9A', '#7FB27A', '#E07A5F'), geo: { lat: 53.0, lon: -8.0 } },
  { id: 2, name: 'Paris', landmark: 'tower', palette: p('#FCE8E2', '#D9CDE6', '#B9A8D6', '#8E7CC3', '#F2785C'), geo: { lat: 48.86, lon: 2.35 } },
  { id: 3, name: 'Italy', landmark: 'arch', palette: p('#FFF0D6', '#F2C89B', '#E0A16B', '#B9774A', '#2E9B5E'), geo: { lat: 41.9, lon: 12.5 } },
  { id: 4, name: 'Greek Islands', landmark: 'windmill', palette: p('#E6F4FA', '#B9DDEE', '#7FC1E0', '#3E8FC0', '#F5B700'), geo: { lat: 36.4, lon: 25.4 } },
  { id: 5, name: 'Egypt', landmark: 'pyramid', palette: p('#FFF1D0', '#F3D58F', '#E8BC61', '#C9933B', '#0E6E8C'), geo: { lat: 29.98, lon: 31.13 } },
  { id: 6, name: 'Kenya Safari', landmark: 'acacia', palette: p('#FFE9C7', '#F2C877', '#C9A25A', '#8C7A3C', '#D55E00'), geo: { lat: -1.3, lon: 36.8 } },
  { id: 7, name: 'India', landmark: 'dome', palette: p('#FFF0DE', '#FFC98B', '#F49D5A', '#D96C3B', '#2E9B5E'), geo: { lat: 27.17, lon: 78.04 } },
  { id: 8, name: 'Thailand', landmark: 'pagoda', palette: p('#E8F7EF', '#B6E2C8', '#7CC9A0', '#3FA374', '#F2785C'), geo: { lat: 13.75, lon: 100.5 } },
  { id: 9, name: 'Japan', landmark: 'snowpeak', palette: p('#FDEEF2', '#F6C8D6', '#E99AB4', '#C76A8E', '#1F2A37'), geo: { lat: 35.36, lon: 138.73 } },
  { id: 10, name: 'Great Wall', landmark: 'wall', palette: p('#F4EEDF', '#CFC6A8', '#A99F7B', '#7D7558', '#C0392B'), geo: { lat: 40.43, lon: 116.57 } },
  { id: 11, name: 'Australia Outback', landmark: 'rock', palette: p('#FFE8D6', '#F0B48A', '#D9824F', '#B05A2E', '#F5B700'), geo: { lat: -25.34, lon: 131.04 } },
  { id: 12, name: 'Hawaii Islands', landmark: 'palm', palette: p('#E5F7F7', '#A8E0DA', '#5FC3B8', '#2E9B8A', '#F2785C'), geo: { lat: 19.9, lon: -155.6 } },
  { id: 13, name: 'Mexico Fiesta', landmark: 'cactus', palette: p('#FFF3D9', '#F8C26A', '#E58F4B', '#C0563A', '#009E73'), geo: { lat: 19.43, lon: -99.13 } },
  { id: 14, name: 'Peru Mountains', landmark: 'peaks', palette: p('#EEF2F7', '#C3CCDA', '#8E9DB5', '#5E6F8C', '#F2785C'), geo: { lat: -13.16, lon: -72.55 } },
  { id: 15, name: 'Brazil Rainforest', landmark: 'jungletree', palette: p('#E9F6E3', '#A9D89A', '#66B565', '#2F8A47', '#F5B700'), geo: { lat: -3.1, lon: -60.0 } },
  { id: 16, name: 'Canada Lakes', landmark: 'pine', palette: p('#EAF3F8', '#B9D3E3', '#6FA5C4', '#2F6F8F', '#D55E00'), geo: { lat: 51.4, lon: -116.2 } },
  { id: 17, name: 'New York', landmark: 'skyline', palette: p('#EFEFF4', '#C8CAD6', '#9A9DB0', '#6A6E85', '#F5B700'), geo: { lat: 40.71, lon: -74.0 } },
  { id: 18, name: 'Iceland Lights', landmark: 'volcano', palette: p('#E7EEF6', '#B8D9D0', '#7FB8B0', '#3F6F7F', '#56B4E9'), geo: { lat: 64.1, lon: -21.9 } },
  { id: 19, name: 'Scotland Highlands', landmark: 'castle', palette: p('#F0EEF5', '#C9C1DC', '#A08BBE', '#6E5A8E', '#2E9B5E'), geo: { lat: 57.1, lon: -4.7 } },
  { id: 20, name: 'Antarctica', landmark: 'iceberg', palette: p('#F2F8FC', '#D9EBF5', '#B4D6EA', '#86B9D6', '#0E6E8C'), geo: { lat: -77.8, lon: 166.7 } },
];

export const WORLD_COUNT = WORLDS.length;

export function worldOf(levelId: number, levelsPerWorld = 60): WorldDef {
  const index = Math.min(WORLD_COUNT, Math.ceil(levelId / levelsPerWorld)) - 1;
  return WORLDS[Math.max(0, index)];
}
