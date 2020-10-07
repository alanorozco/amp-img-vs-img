// This gets inlined as a <script>.

window.__vitals__ = {};

function performanceObserverSupports(type) {
  const supported = (PerformanceObserver || {}).supportedEntryTypes;
  return supported && supported.indexOf(type) > -1;
}

function measureLcp() {
  if (!performanceObserverSupports("largest-contentful-paint")) {
    return;
  }
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const entry = entries[entries.length - 1];
    window.__vitals__.lcp = entry.renderTime || entry.loadTime;
  }).observe({
    type: "largest-contentful-paint",
    buffered: true,
  });
}

let cls;
function measureCls() {
  if (!performanceObserverSupports("layout-shift")) {
    return;
  }
  cls = 0;
  new PerformanceObserver((list) =>
    list
      .getEntries()
      .filter((entry) => !entry.hadRecentInput)
      .forEach((entry) => (cls += entry.value))
  ).observe({ type: "layout-shift", buffered: true });

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      window.__vitals__.cls = cls;
    }, 1500);
  });
}

measureLcp();
measureCls();
