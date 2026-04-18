import test from "@primate/test";

const browser = test.backend(import.meta.dirname);

test.case("async", async assert => {
  await using tab = await browser.open();
  assert(await tab.text("/async ")).equals("Hi from async");
})
