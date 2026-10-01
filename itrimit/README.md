# iTrimIt

Clock hours, pack and pin gear lists to jobs, log gear use per site, keep gear maintenance notes.

    npm install
    npm run build          # dist/web (installable web app), dist/iTrimIt.html (single file)

## Android APK

Needs JDK 21 (Android Studio's bundled one works) and the Android SDK. Gradle fetches anything missing.

    npm run build:apk -- "C:/Users/you/Documents/coding/Android/Sdk"   # first time: SDK path
    npm run build:apk                                                  # after that

Output: ./iTrimIt.apk (web build without service worker → cap sync → gradlew assembleDebug).

After changing icon.svg: `npm run android:assets` (adaptive launcher icons + splash).
