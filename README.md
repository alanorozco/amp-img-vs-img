# `<amp-img>` vs. native `<img>`

Toolkit to measure difference in [web vitals](https://web.dev/vitals) when `<img>` is used in favor of `<amp-img>`. See steps in sections below, but if you have a large set of URLs, then simply:

```sh
npm install
node filter.js my_list_of_urls.txt > fetch_all.sh
chmod +x fetch_all.sh
./fetch_all.sh
./benchmark.sh
```

...individually:

## 0. Install

```sh
npm install
```

## 1. Filter and resolve URLs

A text file containing URLs is filtered and outputs a shell script:

```sh
node filter.js my_list_of_urls.txt > fetch_all.sh
chmod +x fetch_all.sh # make runnable
```

1. Takes a list of URLs of AMP documents, or documents that link to an AMP version
2. Filters them randomly\*
3. Resolves AMP version if linked
4. Prints as shell commands, to output into script `> my_script.sh`

```sh
# file is written like:
node fetch.js `printf "%q" "https://paired-amp/amp/url.html"`
node fetch.js `printf "%q" "https://amp-first/url.html"`
# etc.
```

\* optional additional argument for inclusion probability:

```sh
node filter.js my_list_of_urls.txt 0.000045 > fetch_all.sh
```

use `1` to include all urls:

```sh
node filter.js my_list_of_urls.txt 1 > fetch_all.sh
```

## 2. Fetch & transform URLs

To transform the previously filtered URLs, execute output script:

```sh
./fetch_all.sh
```

Otherwise, run command for an individual URL:

```sh
node fetch.js "https://some-url-probably-amp.com/some/path"
```

...which inserts into `output/`:

```
output/
  some--url--probably--amp-com/
    url.txt                    # full url
    amp-img__unoptimized.html  # as-is
    amp-img.html               # optimized
    img.html                   # optimized, using native <img>
```

`amp-img.html` and `img.html` are transformed like a cache would by using [the AMP optimizer](https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/node-amp-optimizer/?format=websites).

## 3. Measure

Use [`tachometer`](https://www.npmjs.com/package/tachometer) to measure for **LCP** and **CLS** on documents transformed previously:

```sh
./benchmark
```

This compares metrics between optimized output documents:

- `output/**/amp-img.html`
- `output/**/img.html`

Results are output as `result-*` files:

```
output/
  some--url--probably--amp-com/
    ...
    result-lcp.json            # LCP: full results
    result-lcp.csv             # LCP: summary table
    result-cls.json            # CLS: full results
    result-cls.csv             # CLS: summary table
```

LCP and CLS are measured using a `PerformanceObserver`, see [`inline-perf-script.js`](./inline-perf-script.js) to see how results are measured.
