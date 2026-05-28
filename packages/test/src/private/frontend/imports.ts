import type setup from "#setup";
import test from "@primate/test";
type Browser = ReturnType<typeof setup>;

export default function style(browser: Browser) {
  [
    "pound-bare",
    "pound-extension",
    "relative-bare",
    "relative-extension",
    "string",
  ].forEach(route => {
    test.case(route, async assert => {
      await using tab = await browser.open();

      await tab.goto(`/imports/${route}`);
      assert(tab.get("h1").text()).equals("Hello, world");
    });
  });
}
