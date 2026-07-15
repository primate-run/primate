import test from "@primate/test";
import frontends from "../lib/frontends.ts";

const browser = test.setup(import.meta.dirname);

test.ended(async () => {
  await browser.close();
});

for (const { name } of frontends) {
  test.case(`${name} renders directly`, async assert => {
    await using tab = await browser.open();
    await tab.goto(`/${name}`);
    assert(tab.get("#current").text()).equals(name);
  });
}

for (const { name: from } of frontends) {
  for (const { name: to } of frontends) {
    test.case(`${from} navigates to ${to}`, async assert => {
      await using tab = await browser.open();
      await tab.goto(`/${from}`);
      assert(tab.get("#current").text()).equals(from);

      await tab.click(`#to-${to}`);
      try {
        await tab.waitfor(() => tab.pathname() === `/${to}` && tab.get("#current").text() === to);
      } catch (error) {
        throw new Error(`${from} -> ${to} ended at ${tab.pathname()} with ${tab.get("#current").text()}: ${tab.get("body").html()}`, {
          cause: error,
        });
      }

      assert(tab.pathname()).equals(`/${to}`);
      assert(tab.get("#current").text()).equals(to);
    });
  }
}
