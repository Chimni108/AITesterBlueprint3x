#!/usr/bin/env bash
# Clone the two framework repos (source #1 and #2) into their data folders.
set -euo pipefail
cd "$(dirname "$0")/.."

clone_or_pull() {
  local url="$1" dest="$2"
  if [ -d "$dest/.git" ]; then
    git -C "$dest" pull --ff-only
  else
    git clone --depth 1 "$url" "$dest"
  fi
}

clone_or_pull https://github.com/PramodDutta/ATB13xSeleniumAdvanceFramework data/01_selenium_framework/repo
clone_or_pull https://github.com/PramodDutta/Advance-Playwright-Framework   data/02_playwright_framework/repo
echo "Framework repos ready."
