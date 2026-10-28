import fs from 'node:fs';
import path from 'node:path';
import { colors } from '../src/ui/theme';

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

  test('only 64-bit phone ABI (MMKV v4 has no 32-bit support; x86_64 is emulator-only)', () => {
    expect(android('gradle.properties')).toMatch(/^reactNativeArchitectures=arm64-v8a$/m);
  });

  // Until JS draws the splash Android shows the theme's window: the splash's ocean blue, never a white or black flash
  test('launch window matches the splash background', () => {
    expect(android('app/src/main/res/values/styles.xml')).toContain(
      '<item name="android:windowBackground">@color/bg_ocean</item>',
    );
    expect(android('app/src/main/res/values/colors.xml')).toContain(colors.primaryOcean);
  });

  // R8 shrinks release code; without keep.xml the resource shrinker deletes images that are
  // only named from the JS bundle, and JNI libraries crash if their classes are renamed
  test('R8 and resource shrinking are on with keep rules', () => {
    const gradle = android('app/build.gradle');
    expect(gradle).toMatch(/^def enableProguardInReleaseBuilds = true$/m);
    expect(gradle).toContain('shrinkResources enableProguardInReleaseBuilds');
    expect(android('app/src/main/res/raw/keep.xml')).toContain('@drawable/*,@raw/*');
    const rules = android('app/proguard-rules.pro');
    expect(rules).toContain('-keep class com.reactnative.skia.** { *; }');
    expect(rules).toContain('-keep class com.margelo.nitro.** { *; }');
  });
});
