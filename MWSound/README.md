# M&W Sound (v1.2.0)

Offline-first player for *That Mitchell and Webb Sound* (archive.org item `that-mitchell-and-webb-sound-thmianweso`).

- Browse all 29 episodes; stream or download each one.
- The player bar shows the episode and the sketch it is on. Tap the star to favourite a sketch.
- Favourites tab plays just those sketch segments, back to back.
- **Bookmarks:** tap 🔖 in the player to save the exact spot (works with no sketch list). Bookmarks tab: play, rename, delete, or "Use as a sketch start" to turn it into a sketch time.
- Sketch **names** are pre-loaded for series 1-4. Sketch **start times** are not published anywhere I could find, so use
  Auto-detect (guesses from gaps in the audio) and/or Edit times -> "Mark next sketch starts NOW" while listening.
- Real timestamps, if you find any, go in `www/data.js` under `MW_TIMESTAMPS`, e.g. `"s01e01": [0, 95.5, 210]`.

## Build the APK
- In this repo the workflow is `.github/workflows/build-mw-apk.yml` (runs on changes under `MWSound/`, or Actions -> Build MW Sound APK -> Run workflow). Download the `mw-sound-apk` artifact.
- Locally: `cd MWSound && npm install && npx cap add android && npx cap sync android && cd android && ./gradlew assembleDebug`.
  Needs JDK 17+, the Android SDK (platform 34, build-tools 34.0.0) and `ANDROID_HOME`.

## Verification status (v1.0.2)
Verified:
- All 29 file names/dates in `www/data.js` match the archive.org item's file list exactly (checked via the metadata API).
- Debug APK builds (Capacitor 6.2, compileSdk 34) and contains the current `www/` files.
- UI loads without errors in headless Chromium: version, full-screen button, Clear save.
- Browser path: decode a real MP3 -> auto-detect -> play a sketch from its detected time (synthetic audio).

v1.2.0: auto-detect rewritten around applause (end of a sketch = sustained bright noisy clap) followed by a voice/tone change, with loudness dips as a weaker fallback. Synthetic waveform test: `npm test` (scripts/test-applause.mjs). v1.1.3: Auto-detect always enabled (offers to download first); download progress/error shown on the episode screen. v1.1.2: sketch names on every episode row, on-screen error banner and Settings > Diagnostics, CSS fix for older WebViews. v1.1.1: sketch list shown first in each episode, Settings shows how many sketch names are built in. v1.1.0: bookmarks; auto-detect has Stricter/Looser sensitivity and ▶ per row to check each break by ear; episodes with no times open in edit mode. v1.0.2 fix: native download failed with ENOENT because Capacitor's `downloadFile` does not create the `mw/` folder; the app now creates it first (cause confirmed in the plugin source; *not yet re-tested on a device).

NOT verified (marked *):
- *Download of real episodes: archive.org audio redirects to a mirror host that was blocked in the build sandbox.
- *Native download/playback on an Android device (Capacitor Filesystem `downloadFile`, `convertFileSrc`, seeking in saved files).
- *Playback with the screen locked. The manifest has only INTERNET: no foreground service or wake lock, so Android may pause audio after the screen has been off for a while. Test on a phone; if it stops, a foreground-service plugin is needed.
- *Auto-detect on real episodes. v1.2.0 looks for applause then a new voice. On synthetic audio (voices, loud mid-sketch laughs, applause) it found 12/12 boundaries where the old dip detector found 1/12, but it only found 4/12 when applause was quieter than the laughs. Real episodes are untested: treat results as guesses, use Stricter/Looser and ▶ to check by ear.
- *Series 5 sketch names: British Comedy Guide wasn't reachable from the build sandbox, so Series 5 has no names (auto-detect numbers them; rename in app).
- *Sketch start times: none found online (searched web, YouTube, British Comedy Guide, Wikipedia; reddit was not searchable). `MW_TIMESTAMPS` is still empty.
