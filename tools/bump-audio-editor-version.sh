#!/bin/sh
# Give every audio-editor file link a new ?v= so browsers and the offline cache pick up a release.
set -e
cd "$(dirname "$0")/../audio-editor"
V=$(date -u +%Y%m%d%H%M)
sed -i -E "s/\?v=[0-9a-z]+/?v=$V/g" index.html
echo "audio-editor version $V"
