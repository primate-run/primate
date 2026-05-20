import test from "@primate/test";
import env from "@rcompat/env";

const ssr = env.try("SSR") !== "0";
const csr = env.try("CSR") !== "0";

const browser = test.template(import.meta.dirname);

const visible_html = (html: string) =>
  html
    .replaceAll("<!>", "")
    .replace(/<!--[^]*?-->/g, "")
    .replace(/\s+/g, " ");

const has_id = (html: string, id: string) =>
  html.includes(`id="${id}"`) || html.includes(`id=${id}`);

test.case("provides layout and counter html in ssr modes", async assert => {
  if (!ssr) return;

  await using tab = await browser.open();

  const html = visible_html(await tab.text("/counter"));

  assert(has_id(html, "layout")).true();
  assert(html.includes("<h2>Layout</h2>")).true();
  assert(html.includes("Count: 0")).true();
});

test.case("counter is interactive in csr modes", async assert => {
  if (!csr) return;

  await using tab = await browser.open();

  await tab.goto("/counter");
  await tab.waitfor(() => tab.get("p").text() === "Count: 0");

  assert(tab.get("#layout").exists()).true();
  assert(tab.get("h2").text()).equals("Layout");

  await tab.click("button:last-of-type");
  await tab.waitfor(() => tab.get("p").text() === "Count: 1");
  assert(tab.get("p").text()).equals("Count: 1");

  await tab.click("button:first-of-type");
  await tab.waitfor(() => tab.get("p").text() === "Count: 0");
  assert(tab.get("p").text()).equals("Count: 0");
});

test.case("follows client navigation in csr modes", async assert => {
  if (!csr) return;

  await using tab = await browser.open();

  await tab.goto("/");
  await tab.waitfor(() => tab.get("h1").text() === "Hello");

  assert(tab.get("#layout").exists()).true();
  assert(tab.get("h2").text()).equals("Layout");

  (tab.window as any).__marko_navigation_guard = "kept";

  await tab.click("#to-props");
  await tab.waitfor(() =>
    tab.pathname() === "/props" && tab.get("span").text() === "bar",
  );

  assert(tab.pathname()).equals("/props");
  assert(tab.get("span").text()).equals("bar");
  assert(tab.get("#layout").exists()).true();
  assert(tab.get("h2").text()).equals("Layout");
  assert((tab.window as any).__marko_navigation_guard).equals("kept");
});

test.case("restores views with browser back and forward in csr modes", async assert => {
  if (!csr) return;

  await using tab = await browser.open();

  await tab.goto("/");
  await tab.waitfor(() =>
    tab.pathname() === "/" && tab.get("h1").text() === "Hello",
  );

  assert(tab.pathname()).equals("/");
  assert(tab.get("h1").text()).equals("Hello");
  assert(tab.get("#layout").exists()).true();
  assert(tab.get("h2").text()).equals("Layout");

  (tab.window as any).__marko_navigation_guard = "kept";

  await tab.click("#to-props");
  await tab.waitfor(() =>
    tab.pathname() === "/props" && tab.get("span").text() === "bar",
  );

  assert(tab.pathname()).equals("/props");
  assert(tab.get("span").text()).equals("bar");
  assert(tab.get("#layout").exists()).true();
  assert(tab.get("h2").text()).equals("Layout");
  assert((tab.window as any).__marko_navigation_guard).equals("kept");

  await tab.back();
  await tab.waitfor(() =>
    tab.pathname() === "/" && tab.get("h1").text() === "Hello",
  );

  assert(tab.pathname()).equals("/");
  assert(tab.get("h1").text()).equals("Hello");
  assert(tab.get("#layout").exists()).true();
  assert(tab.get("h2").text()).equals("Layout");
  assert((tab.window as any).__marko_navigation_guard).equals("kept");

  await tab.forward();
  await tab.waitfor(() =>
    tab.pathname() === "/props" && tab.get("span").text() === "bar",
  );

  assert(tab.pathname()).equals("/props");
  assert(tab.get("span").text()).equals("bar");
  assert(tab.get("#layout").exists()).true();
  assert(tab.get("h2").text()).equals("Layout");
  assert((tab.window as any).__marko_navigation_guard).equals("kept");
});

test.case("keeps request as a normal route prop", async assert => {
  await using tab = await browser.open();

  await tab.goto("/request-prop");
  await tab.waitfor(() => tab.get("#request").text() === "foo");

  assert(tab.get("#request").text()).equals("foo");
});

test.case("missing props are empty", async assert => {
  await using tab = await browser.open();

  await tab.goto("/no-props");
  assert(tab.get("#request").text()).equals("");
});

test.case("pure ssr does not emit hydration payload", async assert => {
  if (!(ssr && !csr)) return;

  await using tab = await browser.open();

  const html = await tab.text("/counter");

  assert(html.includes('id="hydration"')).false();
  assert(html.includes('type="module"')).false();

  await tab.goto("/counter");
  assert(tab.get("#hydration").exists()).false();
});

test.case("navigation preserves query string", async assert => {
  await using tab = await browser.open();

  await tab.goto("/link-with-query");
  await tab.click("#link");

  csr && await tab.waitfor(() =>
    tab.pathname() === "/linked-with-query"
    && tab.window.location.search === "?foo=bar"
    && tab.get("#linked").text() === "linked",
  );

  assert(tab.pathname()).equals("/linked-with-query");
  assert(tab.window.location.search).equals("?foo=bar");
  assert(tab.get("#linked").text()).equals("linked");
});
