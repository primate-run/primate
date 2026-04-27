import setup from "#setup";
import test from "@rcompat/test";

export default function template(dirname: string) {
  const browser = setup(dirname);

  test.ended(async () => {
    await browser.close();
  });

  test.case("renders h1", async assert => {
    await using tab = await browser.open();
    await tab.goto("/");
    assert(tab.get("h1").text()).equals("Hello");
  });

  test.case("renders props", async assert => {
    await using tab = await browser.open();
    await tab.goto("/props");
    assert(tab.get("span").text()).equals("bar");
  });

  return browser;
}
