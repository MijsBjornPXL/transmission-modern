# Changelog

## v2.8.4 — Installer auto-detection and safer rollback

- Automatically detect the Transmission Web UI directory, including Debian `public_html`.
- Honor the running daemon's `TR_WEB_HOME` when present.
- Stop safely if multiple candidate web directories are found; allow a manual path override.
- Save the exact installed web directory in each backup for accurate rollback.
- No dashboard layout changes; preserve existing v2.8.3 grid preferences.

## v2.8.3 — Fixed library header and separate controls

- Library title, update time, theme picker and Minimal/Cards toggle remain fixed above the grid.
- Search is an independently movable/resizable tile.
- Status filters and sort selector are another independently movable/resizable tile.
- Migrate existing v2.8.2 grid layout settings without changing torrent positions.
- Drag and resize controls remain edit-only.

## v2.8.2 — Movable Library Controls

- Library header and search/filter/sort controls are now independent draggable and resizable grid tiles.
- Existing v2.8 dashboard layouts are migrated to the new layout storage key.
- Normal mode remains clean; drag and resize handles appear only in edit mode.

## v2.8.1 — Edit-only resize handles

- Hide resize corner triangles when dashboard edit mode is off.
- Keep resize handles available in edit mode, without changing tile layouts or torrent actions.

## v2.8.0 — 2026-10-24

- Replaced the single large Torrent List tile with a separate draggable, resizable tile for every torrent.
- Torrent tiles can be placed freely between Download, Upload, Active and Total statistic tiles.
- Preserved Minimal/Cards modes, torrent actions, search, filters, sorting, batch selection and progress animation.
- Persisted per-torrent layout by stable torrent hash with separate mobile/desktop preferences.
- Migrates saved v2.7 statistic layout where available.

## v2.7.3 — 2026-10-24

- Faster tile swapping (35 ms guard instead of 110 ms) and 115 ms reposition animation (previously 220 ms).
- Lightweight torrent-list drag preview to avoid expensive duplication of torrent rows.
- Avoid unnecessary reflow animations when tile order is unchanged.
- Updated asset cache versions.


## v2.7.2 — 2026-10-24

- Added a floating tile preview that follows the pointer while dragging.
- Reorders tiles live with smooth transitions instead of jumping on release.
- Keeps a visible placeholder and respects reduced-motion settings.

## v2.7.1 — 2026-10-24

- Fixed drag-and-drop hit testing; drag from the tile surface or handle.
- Made Edit an icon-only header button.
- Fixed independent tile heights in CSS Grid.
- Detect Debian `public_html` installation path automatically.


## v2.7.0 — 2026-10-24

- Added **Arctic Cyan** and **Cyberpunk Neon** presets (ten themes total).
- Added a responsive, editable dashboard grid with **Edit** next to Refresh.
- Drag to reorder tiles, resize their width/height, and show or hide each tile.
- Save, cancel, reset, and keyboard-arrow reordering controls.
- Separate browser-local desktop and mobile layouts; no Transmission RPC or daemon changes.


## v2.6.0 — 2026-10-23

- Added eight theme presets, including black, gray and white options.
- Refined desktop Minimal View so the wide progress bar stays within each torrent row.
- Preserved responsive phone portrait and landscape layouts.

## Earlier iterations

v2.1–v2.5 iteratively introduced the modern blue UI, mobile-responsive layouts, Minimal/Cards switching, animated progress bars, and the theme picker.
