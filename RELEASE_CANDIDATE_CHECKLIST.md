# VibeTube v3.8 Release Candidate checklist

## Build
- [ ] `./gradlew test`
- [ ] `./gradlew assembleDebug`
- [ ] `./gradlew assembleRelease` with a local `keystore.properties`
- [ ] `apksigner verify app-release.apk`
- [ ] verify APK/AAB with the release keystore

## Playback
- [ ] play/pause/seek
- [ ] background playback
- [ ] MediaLibrary browse/search
- [ ] Android Auto
- [ ] PiP
- [ ] process death + resume

## Downloads
- [ ] start
- [ ] pause/interruption
- [ ] resume
- [ ] remove
- [ ] offline playback

## Sync
- [ ] login on device A
- [ ] create playlist
- [ ] sync on device B
- [ ] edit on both devices
- [ ] verify conflict policy
- [ ] resume position sync

## Security
- [ ] real HTTPS
- [ ] production JWT secret only on server
- [ ] release keystore outside source control
- [ ] R8/minification enabled
