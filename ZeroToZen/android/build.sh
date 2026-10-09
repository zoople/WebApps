#!/usr/bin/env bash
# Builds ZeroToZen.apk without the Android SDK: aapt (v1), dx, javac, uber-apk-signer.
# Usage: TOOLS=/path/to/tools ./build.sh      (TOOLS holds android.jar, dx.jar, uber.jar, aapt)
set -euo pipefail
cd "$(dirname "$0")"
TOOLS=${TOOLS:?set TOOLS to the directory with android.jar dx.jar uber.jar aapt}
OUT=${OUT:-build}
rm -rf "$OUT" && mkdir -p "$OUT"/{gen,classes,assets}
cp ../zero-to-zen.html "$OUT/assets/index.html"
[ -f release.keystore ] || keytool -genkeypair -keystore release.keystore -storepass zerotozen -keypass zerotozen \
  -alias zerotozen -keyalg RSA -keysize 2048 -validity 36500 -dname "CN=Zero to Zen" >/dev/null 2>&1
"$TOOLS/aapt" package -f -M AndroidManifest.xml -S res -A "$OUT/assets" -I "$TOOLS/android.jar" \
  -J "$OUT/gen" -F "$OUT/base.apk" --min-sdk-version 24 --target-sdk-version 33
javac --release 8 -nowarn -cp "$TOOLS/android.jar" -d "$OUT/classes" $(find "$OUT/gen" src -name '*.java') 2>&1 | grep -v "^Note\|warning" || true
java -cp "$TOOLS/dx.jar" com.android.dx.command.Main --dex --min-sdk-version=24 --output="$OUT/classes.dex" "$OUT/classes"
( cd "$OUT" && "$TOOLS/aapt" add base.apk classes.dex >/dev/null )
java -jar "$TOOLS/uber.jar" -a "$OUT/base.apk" --ks release.keystore --ksAlias zerotozen --ksPass zerotozen --ksKeyPass zerotozen \
  -o "$OUT/signed" --allowResign >/dev/null
cp "$OUT"/signed/*-aligned-signed.apk "$OUT/ZeroToZen.apk"
ls -la "$OUT/ZeroToZen.apk"
