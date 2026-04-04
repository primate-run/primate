import test from "@primate/test";

test.frontend(import.meta.dirname);

const browser = test.setup(import.meta.dirname);

test.case("/style", async assert => {
  await using tab = await browser.open();
  await tab.goto("/style");
  const el = tab.select("#hello") as Element;
  const color = (tab.window as any).getComputedStyle(el).color;
  assert(color).equals("red");
});
