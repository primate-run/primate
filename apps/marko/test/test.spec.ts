import test from "@primate/test";

const browser = test.frontend(import.meta.dirname);

test.frontend.style(browser);

test.case("style module", async assert => {
  await using tab = await browser.open();
  await tab.goto("/style-module");
  const color = tab.window.getComputedStyle(tab.get("#hello").get()).color;
  assert(color).equals("red");
  const foo = tab.window.getComputedStyle(tab.get("#hello-foo").get()).color;
  assert(foo).equals("orange");
});
