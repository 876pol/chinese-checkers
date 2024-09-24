#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit
rm -r dist
parcel build index.html
cp -a fonts dist
cp -a img dist
