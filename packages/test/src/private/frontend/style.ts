import type setup from "#setup";
import test from "@primate/test";

type Browser = ReturnType<typeof setup>;

export default function style(browser: Browser) {
  test.case("/style", async assert => {
    await using tab = await browser.open();
    await tab.goto("/style");
    const color = tab.window.getComputedStyle(tab.get("#hello").get()).color;
    assert(color).equals("red");
  });
}
