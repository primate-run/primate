import setup from "#setup";
import runner from "@rcompat/test";

export default function test(dirname: string) {
  const ready = setup(dirname);

  runner.ended(async () => {
    const harness = await ready;
    await harness.close();
  });

  runner.case("renders h1", async assert => {
    const harness = await ready;
    await harness.goto("/");
    assert(harness.select("h1")?.textContent).equals("Hello");
  });

  runner.case("submitted flips to true after 204", async assert => {
    const harness = await ready;
    await harness.goto("/submit");
    await harness.click("button");
    assert(harness.select("#submitted")).not.null();
  });

  runner.case("redirect navigates to new page", async assert => {
    const harness = await ready;
    await harness.goto("/redirect");
    await harness.click("button");
    await harness.waitfor(() => harness.select("h1")?.textContent === "Redirected");
    assert(harness.select("h1")?.textContent).equals("Redirected");
  });

  runner.case("back after redirected submit restores previous page", async assert => {
    const harness = await ready;

    await harness.goto("/redirect");
    await harness.click("button");
    await harness.waitfor(() => harness.select("h1")?.textContent === "Redirected");

    await harness.back();
    await harness.waitfor(() => harness.pathname() === "/redirect");
    await harness.waitfor(() => harness.select("form") !== null);

    assert(harness.pathname()).equals("/redirect");
    assert(harness.select("form")).not.null();
    assert(harness.select("h1")).null();
  });

  runner.case("forward after back restores redirected page", async assert => {
    const harness = await ready;

    await harness.goto("/redirect");
    await harness.click("button");

    await harness.waitfor(() =>
      harness.pathname() === "/redirected" &&
      harness.select("h1")?.textContent === "Redirected",
    );

    await harness.back();

    await harness.waitfor(() =>
      harness.pathname() === "/redirect" &&
      harness.select("form") !== null,
    );

    await harness.forward();

    await harness.waitfor(() =>
      harness.pathname() === "/redirected" &&
      harness.select("h1")?.textContent === "Redirected",
    );

    assert(harness.pathname()).equals("/redirected");
    assert(harness.select("h1")?.textContent).equals("Redirected");
  });
}
