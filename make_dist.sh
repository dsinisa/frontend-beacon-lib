#!/usr/bin/env bash

bower install
cd bower_components/visionmedia-debug
make
make browser
cd ../..
mkdir dist
cp src/static/scripts/beaconSettings.js dist/default-config.js
cat src/static/scripts/beaconCode.js bower_components/visionmedia-debug/dist/debug.js src/scripts/afterDebug.js > dist/frontend-beacon-lib.js
uglifyjs dist/frontend-beacon-lib.js -c -m > dist/frontend-beacon-lib.min.js
