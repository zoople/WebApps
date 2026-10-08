#!/usr/bin/env bash
# Builds MagicDuel.apk from ./web (the game) + ./android (native WebView shell).
# Needs: JDK 11+, aapt, dalvik-exchange (dx), zipalign, apksigner, android.jar (API 23+).
# On Ubuntu: apt install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23
set -euo pipefail
unset JAVA_TOOL_OPTIONS
cd "$(dirname "$0")"
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
OUT=build; rm -rf $OUT; mkdir -p $OUT/classes $OUT/assets
cp -r web $OUT/assets/web

# Keystore: debug key, created once and kept out of git
KS=${KS:-$HOME/.magicduel-debug.keystore}
[ -f "$KS" ] || keytool -genkeypair -keystore "$KS" -storepass android -keypass android \
  -alias debug -keyalg RSA -keysize 2048 -validity 36500 -dname "CN=Magic Duel Debug" >/dev/null 2>&1

aapt package -f -M android/AndroidManifest.xml -S android/res -A $OUT/assets \
  -I "$ANDROID_JAR" -F $OUT/unaligned.apk --min-sdk-version 24 --target-sdk-version 33 \
  --version-code 1 --version-name 1.0 -J $OUT
javac -nowarn --release 8 -classpath "$ANDROID_JAR" -d $OUT/classes \
  $(find $OUT -name R.java) $(find android/src -name '*.java')
dalvik-exchange --dex --output=$OUT/classes.dex $OUT/classes
( cd $OUT && aapt add -f unaligned.apk classes.dex >/dev/null )
zipalign -f -p 4 $OUT/unaligned.apk $OUT/aligned.apk
apksigner sign --v4-signing-enabled false --ks "$KS" --ks-pass pass:android --key-pass pass:android \
  --out MagicDuel.apk $OUT/aligned.apk
apksigner verify --verbose MagicDuel.apk | head -5
ls -la MagicDuel.apk
