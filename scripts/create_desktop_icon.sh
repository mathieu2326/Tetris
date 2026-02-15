#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_DIR="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
SHORTCUT_PATH="$DESKTOP_DIR/Tetris.desktop"
ICON_PATH="$REPO_DIR/assets/tetris-icon.svg"
HTML_PATH="$REPO_DIR/index.html"

mkdir -p "$DESKTOP_DIR"

cat > "$SHORTCUT_PATH" <<DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=Tetris
Comment=Jouer à Tetris
Exec=xdg-open "$HTML_PATH"
Icon=$ICON_PATH
Terminal=false
Categories=Game;
DESKTOP

chmod +x "$SHORTCUT_PATH"

echo "Icône créée : $SHORTCUT_PATH"
echo "Si nécessaire, clic droit > 'Autoriser le lancement' sur l'icône."
