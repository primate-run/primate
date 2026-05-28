import type setup from "#setup";
import test from "@primate/test";

type Browser = ReturnType<typeof setup>;

export default function style(browser: Browser) {
  test.case("/head", async assert => {
    await using tab = await browser.open();

    await tab.goto("/head");
    assert(tab.get("title").text()).equals("Primate app");
    assert(tab.get("meta").attribute("charset")).equals("utf-8");
  });
}
