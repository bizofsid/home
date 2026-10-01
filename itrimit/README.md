# iTrimIt

Clock hours, pack and pin gear lists to jobs, log gear use per site, keep gear maintenance notes.

    npm install
    npm run build          # dist/web (installable web app), dist/iTrimIt.html (single file)

## Android APK

Needs JDK 21 and the Android SDK (platform 36, build-tools 35) with network access to Google's Maven (dl.google.com).

    echo "sdk.dir=$ANDROID_HOME" > android/local.properties
    npm run build:apk      # web build without service worker → cap sync → gradlew assembleDebug → ./iTrimIt.apk

After changing icon.svg: `npm run android:assets` (adaptive launcher icons + splash).
