import setup from "#setup";
import test from "@rcompat/test";

export default function framework(dirname: string) {
  const browser = setup(dirname);

  test.ended(async () => {
    await browser.close();
  });

  test.case("renders h1", async assert => {
    await using tab = await browser.open();
    await tab.goto("/");
    assert(tab.select("h1")?.textContent).equals("Hello");
  });

  test.case("renders props", async assert => {
    await using tab = await browser.open();
    await tab.goto("/props");
    assert(tab.select("span")?.textContent).equals("bar");
  });

  test.case("missing props are empty", async assert => {
    await using tab = await browser.open();
    await tab.goto("/no-props");
    assert(tab.select("#request")?.textContent).equals("");
  });

  test.case("renders request prop", async assert => {
    await using tab = await browser.open();
    await tab.goto("/request-prop");
    assert(tab.select("#request")?.textContent).equals("foo");
  });

  test.case("submitted flips to true after 204", async assert => {
    await using tab = await browser.open();
    await tab.goto("/submit");
    await tab.click("button");
    assert(tab.select("#submitted")).not.null();
  });

  test.case("redirect navigates to new page", async assert => {
    await using tab = await browser.open();
    await tab.goto("/redirect");
    await tab.click("button");
    await tab.waitfor(() => tab.select("h1")?.textContent === "Redirected");
    assert(tab.select("h1")?.textContent).equals("Redirected");
  });

  test.case("back after redirected submit restores previous page", async assert => {
    await using tab = await browser.open();
    await tab.goto("/redirect");
    await tab.click("button");
    await tab.waitfor(() => tab.select("h1")?.textContent === "Redirected");
    await tab.back();
    await tab.waitfor(() => tab.pathname() === "/redirect");
    await tab.waitfor(() => tab.select("form") !== null);
    assert(tab.pathname()).equals("/redirect");
    assert(tab.select("form")).not.null();
    assert(tab.select("h1")).null();
  });

  test.case("forward after back restores redirected page", async assert => {
    await using tab = await browser.open();
    await tab.goto("/redirect");
    await tab.click("button");
    await tab.waitfor(() =>
      tab.pathname() === "/redirected" &&
      tab.select("h1")?.textContent === "Redirected",
    );
    await tab.back();
    await tab.waitfor(() =>
      tab.pathname() === "/redirect" &&
      tab.select("form") !== null,
    );
    await tab.forward();
    await tab.waitfor(() =>
      tab.pathname() === "/redirected" &&
      tab.select("h1")?.textContent === "Redirected",
    );
    assert(tab.pathname()).equals("/redirected");
    assert(tab.select("h1")?.textContent).equals("Redirected");
  });

  test.case("pathname prop reflects current page after navigation", async assert => {
    await using tab = await browser.open();
    await tab.goto("/");
    await tab.click("#pathname");
    assert(tab.select("#pathname")?.textContent).equals("/pathname");
  });

  return browser;
}
