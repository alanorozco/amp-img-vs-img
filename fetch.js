const { JSDOM } = require("jsdom");
const { writeFileSync, mkdirSync, readFileSync } = require("fs");
const fetch = require("node-fetch");
const ampOptimizer = require("@ampproject/toolbox-optimizer");

let inlinePerfScript;
const getInlinePerfScript = () =>
  inlinePerfScript
    ? inlinePerfScript
    : (inlinePerfScript = readFileSync("inline-perf-script.js"));

const noPx = (valOrUndef) =>
  valOrUndef != null ? valOrUndef.replace(/px$/, "") : valOrUndef;

function setAttributeIfNotNull(element, name, value) {
  if (value == null) {
    return;
  }
  element.setAttribute(name, value);
}

function styleAttr(layout, width, height) {
  if (layout === "fill") {
    return [
      "position: absolute",
      "top: 0",
      "left: 0",
      "right: 0",
      "bottom: 0",
      "z-index: 1",
      "max-height: 100%",
      "max-width: 100%",
      "min-height: 100%",
      "min-width: 100%",
    ].join(";");
  }
  if (layout === "responsive") {
    return [
      "display: block",
      "width: 100%",
      "height: auto",
      `aspect-ratio: ${width} / ${height}`,
    ].join(";");
  }
  if (layout === "intrinsic") {
    return [
      "display: inline-block",
      "width: auto",
      "height: 100%",
      `aspect-ratio: ${width} / ${height}`,
    ].join(";");
  }
  if (layout === "fixed") {
    return [
      "display: inline-block",
      `width: ${width}px`,
      `height: ${height}px`,
    ].join(";");
  }
  if (layout === "fixed-height") {
    return ["display: block", "width: 100%", `height: ${height}px`].join(";");
  }
  if (layout === "flex-item") {
    return styleAttr("fill");
  }
  return null;
}

function maybeWrap(document, img, layout) {
  if (layout === "flex-item") {
    const wrapper = document.createElement("amp-layout");
    wrapper.setAttribute("layout", layout);
    // Copy id and classname expecting these to size container.
    wrapper.setAttribute("id", img.getAttribute("id"));
    wrapper.setAttribute("class", img.getAttribute("class"));
    img.setAttribute("id", "");
    img.setAttribute("class", "");
    wrapper.appendChild(img);
    return wrapper;
  }
  return img;
}

function ampimgToImg(html) {
  const dom = new JSDOM(html);

  const { document } = dom.window;

  for (const ampImg of document.querySelectorAll("amp-img")) {
    const width = noPx(ampImg.getAttribute("width"));
    const height = noPx(ampImg.getAttribute("height"));

    const layout = (
      ampImg.getAttribute("layout") ||
      (width != null ? "fixed" : "fixed-height")
    ).toLowerCase();

    const img = document.createElement("img");

    for (const { name, value } of ampImg.attributes) {
      img.setAttribute(name, value);
    }

    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");

    setAttributeIfNotNull(img, "width", width);
    setAttributeIfNotNull(img, "height", height);
    setAttributeIfNotNull(img, "style", styleAttr(layout, width, height));

    ampImg.parentNode.replaceChild(maybeWrap(document, img, layout), ampImg);
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
    addPerfScript(await optimizer.transformHtml(ampimgToImg(html)))
  );
}

(async () => {
  const [_node, _indexjs, url] = process.argv;
  await save(url, ampOptimizer.create());
})();
