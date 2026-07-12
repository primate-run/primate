import type setup from "#setup";
import test from "@primate/test";

type Browser = ReturnType<typeof setup>;

export default function async_schema(browser: Browser) {
  test.case("sync path schema", async assert => {
    await using tab = await browser.open();
    assert(await tab.text("/sync-path/primate")).equals("primate");
  });

  test.case("async path schema", async assert => {
    await using tab = await browser.open();
    assert(await tab.text("/async-path/primate")).equals("PRIMATE");
  });

  test.case("sync body schema derive", async assert => {
    await using tab = await browser.open();
    const response = await tab.fetch("/sync-body", {
      body: JSON.stringify({ name: "primate" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    assert(await response.text()).equals("PRIMATE");
  });

  test.case("async body schema derive", async assert => {
    await using tab = await browser.open();
    const response = await tab.fetch("/async-body", {
      body: JSON.stringify({ name: "primate" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    assert(await response.text()).equals("PRIMATE");
  });
}
