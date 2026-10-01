// Builds the debug APK and copies it to ./iTrimIt.apk. Works on Windows, macOS and Linux.
//   node scripts/build-apk.mjs [path-to-android-sdk]
// The SDK path is only needed the first time; it's saved to android/local.properties.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const IS_WINDOWS = process.platform === 'win32';
const LOCAL_PROPERTIES = 'android/local.properties';
const BUILT_APK = 'android/app/build/outputs/apk/debug/app-debug.apk';

function run(command, args, cwd = '.') {
  // Windows can only start .cmd/.bat files through a shell.
  execFileSync(command, args, { cwd, stdio: 'inherit', shell: IS_WINDOWS });
}

function rememberSdk(sdkArg) {
  if (!sdkArg) return;
  const sdk = resolve(sdkArg);
  if (!existsSync(`${sdk}/platforms`)) throw new Error(`Not an Android SDK folder (no "platforms" inside): ${sdk}`);
  // local.properties wants forward slashes (backslashes are escapes in it).
  writeFileSync(LOCAL_PROPERTIES, `sdk.dir=${sdk.replaceAll('\\', '/')}\n`);
}

rememberSdk(process.argv[2]);
if (!existsSync(LOCAL_PROPERTIES) && !process.env.ANDROID_HOME) {
  throw new Error('Where is the Android SDK? Run: npm run build:apk -- "<path to Sdk folder>"');
}

run('node', ['build.mjs', '--apk']);
run('npx', ['cap', 'sync', 'android']);
run(IS_WINDOWS ? 'gradlew.bat' : './gradlew', ['assembleDebug'], 'android');
copyFileSync(BUILT_APK, 'iTrimIt.apk');
console.log(`\nAPK ready: ${resolve('iTrimIt.apk')}`);
