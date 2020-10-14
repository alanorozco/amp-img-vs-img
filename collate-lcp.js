const FastGlob = require("fast-glob");
const glob = require("fast-glob");
const { readFileSync } = require("fs");

console.log("sample,b_low,b_high,a_low,a_high");
for (const path of glob.sync(["output/**/result-lcp.json"])) {
  console.log(
    JSON.parse(readFileSync(path).toString())
      .benchmarks.map(({ mean }) => [mean.low, mean.high])
      .reduce((a, b) => [...a, ...b], [path.split("/")[1]])
      .join(",")
  );
}
