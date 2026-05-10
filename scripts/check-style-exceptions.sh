#!/usr/bin/env bash
set -euo pipefail

if rg --line-number "StyleSheet\\.create\\(" src; then
  echo "\n[style-check] Found StyleSheet.create usage. Use className-first styling or document a style escape hatch with inline style objects."
  exit 1
fi

if rg --line-number "themeColors" src; then
  echo "\n[style-check] Found legacy themeColors usage. Use CSS token classes or useThemeRuntimeColors for native-only runtime props."
  exit 1
fi

echo "[style-check] OK: no StyleSheet.create usage in src"
