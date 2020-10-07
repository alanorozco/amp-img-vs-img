// 1. Takes a list of URLs of documents that are AMP, or link to an AMP version
// 2. Filters them randomly by probability
// 3. Resolves AMP version if linked
// 4. Prints as a shell command:
//    node fetch.js `printf "%q" "https://paired-amp/amp/url.html"`
//    node fetch.js `printf "%q" "https://amp-first/url.html"`
//    # etc.

// use
//   node filter.js my_list_of_urls.txt > fetch_these_urls.sh
// optional probability of inclusion (0.00001 by default)
//   node filter.js my_list_of_urls.txt 0.0005 > fetch_these_urls.sh
//

const fs = require("fs");
const readline = require("readline");
const { JSDOM } = require("jsdom");

async function getAmphtmlUrl(url) {
  const dom = await JSDOM.fromURL(url);
  const linkRelAmphtml = dom.window.document.head.querySelector(
    "link[rel=amphtml]"
  );
  if (linkRelAmphtml) {
    return new URL(linkRelAmphtml.getAttribute("href"), url).href;
  }
  if (dom.window.document.head.querySelector("link[rel=canonical]")) {
    return url;
  }
}

const [_node, _filename, path, probabilityStr = 0.00001] = process.argv;

const probability = parseFloat(probabilityStr);

const getHostname = (url) => url.replace(/^https?:\/\//, "").split("/")[0];

let count = 0;

const hostnames = new Set();

const file = readline.createInterface({
  input: fs.createReadStream(path),
  output: process.stdout,
  terminal: false,
});

file.on("line", async (url) => {
  const hostname = getHostname(url);
  if (Math.random() > probability) {
    return;
  }
  if (hostnames.has(hostname)) {
    return;
  }
  hostnames.add(hostname);
  try {
    const amphtmlUrl = await getAmphtmlUrl(url);
    if (amphtmlUrl) {
      console.log("node fetch.js", `\`printf "%q" "${amphtmlUrl}"\``);
    }
  } catch {
    // 🤷‍♂️
  }
});
