Grace for Nintendo 3DS: the web game rebuilt as homebrew. Top screen is the arena, the touch screen is all the UI.

- `source/main.c` is the whole game (citro2d). Sound is pre-rendered into buffers at start-up, then played with ndsp.
- `make` builds `grace.3dsx`; `make cia` packages `Grace.cia` (needs makerom and bannertool).
- The **Grace 3DS** workflow builds both on every push to `Grace3DS/`, takes emulator screenshots (Azahar), and attaches everything to a `grace3ds-ci-<n>` pre-release.
