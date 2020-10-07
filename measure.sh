#!/bin/bash

cd output

for D in *; do
  if [ -d "${D}" ]; then
    npx tach \
      --browser=chrome-headless \
      --measure=global \
      --measurement-expression="window.__vitals__.lcp" \
      --json-file="${D}/result-lcp.json" \
      "${D}/amp-img.html" \
      "${D}/img.html"
  fi
done

for D in *; do
  if [ -d "${D}" ]; then
    npx tach \
      --browser=chrome-headless \
      --measure=global \
      --measurement-expression="window.__vitals__.cls" \
      --json-file="${D}/result-cls.json" \
      "${D}/amp-img.html" \
      "${D}/img.html"
  fi
done
