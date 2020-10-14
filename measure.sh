#!/bin/bash

cd output

for D in *; do
  if [ -d "${D}" ]; then
    cat "${D}/url.txt"
    echo "\n"
    npx tach \
      --timeout=1 \
      --browser=chrome-headless \
      --measure=global \
      --measurement-expression="window.__vitals__.lcp" \
      --json-file="${D}/result-lcp.json" \
      --csv-file="${D}/result-lcp.csv" \
      "${D}/amp-img.html" \
      "${D}/img.html"
  fi
done
