import fs from 'node:fs';
import path from 'node:path';

const android = (file: string) => fs.readFileSync(path.join(__dirname, '..', 'android', file), 'utf8');

describe('Android build config', () => {
  // Haptics call Vibration.vibrate on every button tap and drag step;
  // without this permission Android throws SecurityException and the app crashes
  test('VIBRATE permission is declared', () => {
    expect(android('app/src/main/AndroidManifest.xml')).toContain('android.permission.VIBRATE');
  });

  test('New Architecture and Hermes are on', () => {
    const props = android('gradle.properties');
    expect(props).toMatch(/^newArchEnabled=true$/m);
    expect(props).toMatch(/^hermesEnabled=true$/m);
  });

  test('only 64-bit ABIs (MMKV v4 has no 32-bit support)', () => {
    expect(android('gradle.properties')).toMatch(/^reactNativeArchitectures=arm64-v8a,x86_64$/m);
  });
});
