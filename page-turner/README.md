# Page Turner

Turns an Android phone into a Bluetooth LE keyboard that only sends page-turn keys,
so it can act as a wireless page turner for an Xteink X3/X4 running CrossPoint's
Bluetooth page-turner build (or anything else that accepts a BLE keyboard).

- Big **Next** / **Previous** buttons, plus buttons in the notification.
- Volume buttons turn pages, also with the screen off (optional).
- Sends Right/Left arrows by default, or Page Down/Page Up.
- Runs as a foreground service so the phone keeps the same Bluetooth identity and the
  reader can reconnect without re-pairing.

Built by GitHub Actions on the `page-turner` branch; each build is published as a release.
Android 12+.
