const { JSDOM } = require("jsdom");
const { writeFileSync, mkdirSync, readFileSync } = require("fs");
const fetch = require("node-fetch");
const ampOptimizer = require("@ampproject/toolbox-optimizer");

let inlinePerfScript;
const getInlinePerfScript = () =>
  inlinePerfScript
    ? inlinePerfScript
    : (inlinePerfScript = readFileSync("inline-perf-script.js"));

function ssrAmpImg(html) {
  const dom = new JSDOM(html);

  const { document } = dom.window;

  for (const ampImg of document.querySelectorAll("amp-img")) {
    const img = document.createElement("img");

    for (const attr of [
      "alt",
      "aria-describedby",
      "aria-label",
      "aria-labelledby",
      "crossorigin",
      "referrerpolicy",
      "sizes",
      "src",
      "srcset",
      "title",
    ]) {
      if (ampImg.hasAttribute(attr)) {
        img.setAttribute(attr, ampImg.getAttribute(attr));
      }
    }

    img.setAttribute("decoding", "async");
    img.setAttribute(
      "class",
      "i-amphtml-fill-content i-amphtml-replaced-content"
    );

    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");

    ampImg.setAttribute("i-amphtml-ssr", "");
    ampImg.appendChild(img);
  }

  return dom.serialize();
}

function addPerfScript(html) {
  const dom = new JSDOM(html);

  const { document } = dom.window;

  const script = document.createElement("script");
  script.textContent = getInlinePerfScript();

  document.head.insertBefore(script, document.head.firstElementChild);

  return dom.serialize();
}

async function fetchOne(url) {
  try {
    return await (await fetch(url)).text();
  } catch (e) {
    console.error("Failed to fetch", url);
    console.error(e.message);
  }
}

function loudWriteFileSync(file, data) {
  writeFileSync(file, data);
  console.log("->", file);
}

async function save(url, optimizer) {
  const html = await fetchOne(url);
  if (!html) {
    return;
  }
  console.log(url);

  const name = url
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace("-", "--")
    .replace(/[^\w0-9]/gi, "-");

  const dir = `output/${name}`;
  mkdirSync(dir, { recursive: true });

  loudWriteFileSync(`${dir}/url.txt`, url);
  loudWriteFileSync(`${dir}/amp-img__unoptimized.html`, html);
  loudWriteFileSync(
    `${dir}/amp-img.html`,
    addPerfScript(await optimizer.transformHtml(html))
  );
  loudWriteFileSync(
    `${dir}/img.html`,
    addPerfScript(await optimizer.transformHtml(ssrAmpImg(html)))
  );
}

(async () => {
  const [_node, _indexjs, url] = process.argv;
  await save(url, ampOptimizer.create());
})();
