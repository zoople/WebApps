# Zero to Zen — Android app

`ZeroToZen.apk` wraps `../zero-to-zen.html` in a WebView. While a session runs, the web app
calls `window.ZZ.start()`, which starts a foreground media-playback service with a partial
wake lock, so sound and the timer keep going with the screen locked. The WebView is also
patched so Chromium never treats a locked screen as "hidden".

Rebuild (no Android SDK needed): `TOOLS=<dir with android.jar dx.jar uber.jar aapt> ./build.sh`
(android.jar = API 33, dx = com.jakewharton.android.repackaged:dalvik-dx, uber = uber-apk-signer, aapt = v1).

`release.keystore` is the signing key (password `zerotozen`). Keep it: updates only install over
the existing app if signed with the same key.
