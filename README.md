<h1 align="center">Transmission Modern</h1>

<p align="center">
  <img src="docs/screenshots/transmission-modern-showcase.png"
       alt="Transmission Modern by M1jsXploit — desktop and mobile showcase"
       width="100%">
</p>

<p align="center">
  <strong>A modern, responsive Transmission BitTorrent Web UI with 10 customizable themes and a fully editable dashboard.</strong><br>
  Created by <strong>M1jsXploit</strong> · Version <strong>2.8.4</strong>
</p>

---

## Overview

**Transmission Modern** is an open-source alternative web interface for the Transmission BitTorrent daemon. It combines a customizable dashboard grid, individually movable torrent tiles, ten color themes, animated progress bars, and a responsive desktop/mobile experience.

Designed for Linux, Debian, Ubuntu, NAS, homelab, and other self-hosted Transmission installations. It uses the existing Transmission RPC endpoint; no separate backend or build step is required.

> **Unofficial community project.** Not affiliated with, maintained by, or endorsed by the Transmission project.

## Highlights

- **Fully customizable dashboard:** use the pencil icon beside Refresh to enter Edit Mode.
- **One unified grid:** drag individual torrent tiles between Download, Upload, Active, and Total statistics.
- **Independent tile resizing:** resize one tile without changing the height of its neighbors.
- **Separate Search and Filters tiles:** move and resize the search bar independently from the status filters and Activity sort control.
- **Fixed Library header:** YOUR LIBRARY, torrent count, update time, theme picker, and Minimal/Cards controls stay in place.
- **Smooth drag-and-drop:** live drag preview and animated rearrangement.
- **Edit-only controls:** resize corners and drag handles are hidden outside Edit Mode.
- **Saved layouts:** dashboard preferences are stored locally in the browser; new torrents are added to the grid.
- **10 themes:** Ocean Blue, Amethyst, Emerald, Sunset, Obsidian Black, Graphite Gray, Pearl White, Aurora, Arctic Cyan, and Cyberpunk Neon.
- **Torrent management:** add, pause, resume, inspect, filter, sort, and remove torrents.

## Screenshots

### Desktop — Minimal view

![Transmission Modern desktop Minimal view](docs/screenshots/desktop-minimal.png)

### Desktop — Cards view

![Transmission Modern desktop Cards view](docs/screenshots/desktop-cards.png)

### Mobile — Responsive dashboard

<p align="center">
  <img src="docs/screenshots/mobile-arctic-cyan.png" alt="Transmission Modern mobile screenshot" width="370">
</p>

### Theme picker

![Transmission Modern theme picker](docs/screenshots/theme-picker-preview-v2.5.png)

*Some screenshots show earlier versions and may not include the v2.8.4 grid editor or all ten themes. The showcase image is a promotional mockup rather than a literal application screenshot.*

## Features

| Feature | Description |
| --- | --- |
| Dashboard grid | Reorder and resize statistics and individual torrent tiles |
| Library controls | Fixed library heading; independently movable search and filter/sort tiles |
| View modes | Minimal and Cards |
| Themes | Ten selectable color themes; choice saved in the browser |
| Live monitoring | Download/upload speeds, torrent progress, statuses, and activity |
| Torrent actions | Add by magnet link, URL, or `.torrent`; pause, resume, remove, inspect details |
| Torrent details | General, Files, Peers, and Trackers tabs |
| Finding torrents | Search, status filters, and sorting |
| Batch actions | Select multiple torrents for supported actions |
| Mobile support | Responsive portrait layout and compact landscape handling |
| Installation | Shell installer with timestamped web-directory backup and restore script |

The UI polls Transmission for updated data approximately every five seconds and provides a manual Refresh button.

## Ten color themes

| Theme | Style |
| --- | --- |
| Ocean Blue | Deep navy and electric blue |
| Amethyst | Dark purple and violet |
| Emerald | Green and teal |
| Sunset | Orange and coral |
| Obsidian Black | Near-black and neutral accents |
| Graphite Gray | Charcoal and soft gray |
| Pearl White | Light background and blue accents |
| Aurora | Dark base with blue-green accents |
| Arctic Cyan | Icy cyan with deep blue panels |
| Cyberpunk Neon | Dark purple with neon pink and violet |

Use the palette button next to Minimal/Cards to change themes. Preferences are stored in your browser, so separate devices can have different selections.

## Requirements

- Running Transmission daemon with its Web UI/RPC endpoint enabled.
- Modern desktop or mobile browser.
- For the installer: Linux, Bash, and permission to write to the Transmission web directory.

**Known working environment:** Debian with Transmission 4.1.0-beta.2 (as shown by the development test interface). Compatibility with other versions and distributions may vary.

## Installation

The installer backs up the current Transmission **web directory** and installs HTML/CSS/JS files. It does not intentionally change the Transmission daemon configuration, torrents, or downloaded files.

### Option A — Clone the repository

```bash
git clone https://github.com/MijsBjornPXL/transmission-modern.git
cd transmission-modern
sudo bash install.sh
```

If the repository has been transferred to another GitHub account, replace the clone URL with the new repository URL.

### Option B — Download the v2.8.4 release ZIP

Download `Transmission-Modern-v2.8.4.zip` from [Releases](https://github.com/MijsBjornPXL/transmission-modern/releases) and copy it to your server:

```bash
unzip -o Transmission-Modern-v2.8.4.zip -d /tmp
sudo bash /tmp/transmission-modern/install.sh
```

### Web directory detection

The installer automatically discovers the Transmission Web UI directory. It checks the running daemon's `TR_WEB_HOME` setting first, then common package locations and Transmission installation folders. If multiple valid directories exist, it stops and asks you to choose the correct one. Common paths include:

```text
/usr/share/transmission/public_html
/usr/share/transmission/web
```

For a custom path, specify it explicitly:

```bash
sudo bash install.sh /path/to/transmission/web-directory
```

The target directory must exist and contain `index.html`. The detected path is printed before installation, and a backup is created first. If the daemon uses a nonstandard location that cannot be detected, pass it explicitly.

### Open the interface

Use your existing Transmission URL, for example:

```text
http://YOUR-SERVER:9091/transmission/web/?v=284
```

If an older UI remains visible, use **Ctrl + Shift + R** or a private browser tab. A daemon restart is usually unnecessary for static UI changes.

## Customize the dashboard

1. Click the **pencil icon** beside Refresh to enter Edit Mode.
2. Drag a torrent tile or statistic tile to move it. Torrent tiles can be positioned among the statistics.
3. Resize tiles using the corner handle. Each tile has an independent height.
4. Move the **Search** tile and the **Filters / Activity** tile independently.
5. Use visibility controls for supported tiles.
6. Click **Save layout** to keep your changes, **Cancel** to discard them, or **Reset layout** to restore defaults.

The **YOUR LIBRARY** heading, torrent count, update time, theme selector, and Minimal/Cards controls stay fixed outside the movable grid. Layout preferences are saved in the current browser; they do not automatically sync between devices.

## Backup and rollback

Each successful installation creates a backup similar to:

```text
/var/backups/transmission-modern/backup-YYYYMMDD-HHMMSS-XXXX/web
```

The installer records the exact web directory in each new backup and prints the rollback command. To restore the latest backup (for backups made with v2.8.4 or later):

```bash
sudo bash restore.sh
```

For backups made by older installers, or to override the target manually:

```bash
sudo bash restore.sh /var/backups/transmission-modern/backup-YYYYMMDD-HHMMSS-XXXX /usr/share/transmission/public_html
```

**Note:** restoring copies backed-up files over the target directory; it does not remove unrelated files introduced later. Keep your backup until you have verified the restored UI.

## Troubleshooting

| Issue | What to try |
| --- | --- |
| Original Transmission UI still appears | Confirm the installer used the active web directory; hard-refresh the browser |
| No connection to Transmission | Verify the daemon, RPC endpoint, authentication, and network restrictions |
| Tiles are not draggable | Click the pencil icon to enter Edit Mode |
| Layout changes are not saved | Click **Save layout**; check whether the browser permits local storage |
| Resize corners remain visible | Hard-refresh to clear older cached CSS |
| Theme resets | Check local storage and browser privacy settings |
| Need the previous UI | Run `restore.sh` with the backup created by the installer |

## Security and privacy

- Do **not** expose Transmission RPC directly to the public internet without appropriate authentication, access restrictions, and HTTPS.
- This theme does **not** add authentication or TLS; configure those separately.
- Review shell scripts before executing them with `sudo`.
- Avoid sharing screenshots containing private torrent names, server addresses, or credentials.

## Project structure

```text
transmission-modern/
├── index.html
├── css/                  # Responsive styles, themes, progress, grid editor
├── js/                   # RPC, torrent UI, theme picker, grid editor
├── docs/screenshots/     # Screenshots and promotional showcase
├── install.sh            # Backup and install
├── restore.sh            # Restore an earlier web UI backup
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

## Contributing

Issues and pull requests are welcome. Include the Transmission version, operating system, browser, steps to reproduce, and privacy-safe screenshots. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License and credits

Released under the [MIT License](LICENSE). Developed by **M1jsXploit**. Transmission is a separate project.
