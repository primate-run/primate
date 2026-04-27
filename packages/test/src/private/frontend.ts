import setup from "#setup";
import env from "@rcompat/env";
import test from "@rcompat/test";

const ssr = env.try("SSR") !== "0";
const csr = env.try("CSR") !== "0";

function frontend(dirname: string) {
  const browser = setup(dirname);

  test.ended(async () => {
    await browser.close();
  });

  test.case("pure ssr does not emit hydration payload", async assert => {
    if (!(ssr && !csr)) return;

    await using tab = await browser.open();

    const html = await tab.text("/submit");
    assert(html.includes('id="hydration"')).false();
    assert(html.includes('type="module"')).false();

    await tab.goto("/submit");
    assert(tab.get("#hydration").exists()).false();
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

  test.case("missing props are empty", async assert => {
    await using tab = await browser.open();
    await tab.goto("/no-props");
    assert(tab.get("#request").text()).equals("");
  });

  test.case("renders request prop", async assert => {
    await using tab = await browser.open();
    await tab.goto("/request-prop");
    assert(tab.get("#request").text()).equals("foo");
  });

  test.case("submitted flips to true after 204", async assert => {
    await using tab = await browser.open();
    await tab.goto("/submit");
    await tab.click("button");
    assert(tab.get("#submitted").exists()).equals(csr);
  });

  test.case("redirect navigates to new page", async assert => {
    await using tab = await browser.open();
    await tab.goto("/redirect");
    await tab.click("button");
    csr && await tab.waitfor(() => tab.get("h1").text() === "Redirected");
    assert(tab.get("h1").text()).equals("Redirected");
  });

  test.case("back after redirected submit restores previous page", async assert => {
    await using tab = await browser.open();
    await tab.goto("/redirect");
    await tab.click("button");
    csr && await tab.waitfor(() => tab.get("h1").text() === "Redirected");
    await tab.back();
    csr && await tab.waitfor(() => tab.pathname() === "/redirect");
    csr && await tab.waitfor(() => tab.get("form").exists());
    assert(tab.pathname()).equals("/redirect");
    assert(tab.get("form").exists()).true();
    assert(tab.get("h1").exists()).false();
  });

  test.case("forward after back restores redirected page", async assert => {
    await using tab = await browser.open();
    await tab.goto("/redirect");
    await tab.click("button");
    csr && await tab.waitfor(() =>
      tab.pathname() === "/redirected" && tab.get("h1").text() === "Redirected",
    );
    await tab.back();
    csr && await tab.waitfor(() =>
      tab.pathname() === "/redirect" && tab.get("form").exists(),
    );
    await tab.forward();
    csr && await tab.waitfor(() =>
      tab.pathname() === "/redirected" && tab.get("h1").text() === "Redirected",
    );
    assert(tab.pathname()).equals("/redirected");
    assert(tab.get("h1").text()).equals("Redirected");
  });

  test.case("pathname prop reflects current page after navigation", async assert => {
    await using tab = await browser.open();
    await tab.goto("/");
    await tab.click("#pathname");
    assert(tab.get("#pathname").text()).equals("/pathname");
  });

  const cases = {
    json: JSON.stringify({ foo: "bar" }),
    text: "hello",
    form: JSON.stringify({ foo: "bar" }),
    multipart: JSON.stringify({ foo: "bar", file: "hello" }),
    blob: "hello",
    schema: JSON.stringify({ foo: "bar" }),
  };

  if (csr) {
    test.case("route client call returns typed response", async assert => {
      await using tab = await browser.open();
      for (const [name, returns] of Object.entries(cases)) {
        await tab.goto(`/route-client/${name}`);
        await tab.click("button");
        await tab.waitfor(() => tab.get("#result").exists());
        assert(tab.get("#result").text()).equals(returns);
      }
    });

    test.case("route client schema rejects invalid body", async assert => {
      await using tab = await browser.open();
      await tab.goto("/route-client/schema");
      await tab.click("#send-invalid");
      await tab.waitfor(() => tab.get("#error").exists());
      assert(tab.get("#error").text()).equals("400");
    });
  }

  test.case("route client call works at top level", async assert => {
    await using tab = await browser.open();
    for (const [name, returns] of Object.entries(cases)) {
      await tab.goto(`/route-client/${name}?top-level`);
      assert(tab.get("#result").text()).equals(returns);
    }
  });

  if (csr) {
    test.case("route client action form succeeds", async assert => {
      await using tab = await browser.open();
      await tab.goto("/route-client/action");
      await tab.set("#foo", "hello");
      await tab.click("#send");
      await tab.waitfor(() => tab.get("#result").exists());
      assert(tab.get("#result").json()).equals({ foo: "hello" });
    });

    test.case("route client action form shows field error", async assert => {
      await using tab = await browser.open();
      await tab.goto("/route-client/action");
      await tab.set("#foo", "bar");
      await tab.click("#send");
      await tab.waitfor(() => tab.get("#error").exists());
      assert(tab.get("#error").text()).equals("min 5 characters");
    });

    test.case("url-bound form succeeds", async assert => {
      await using tab = await browser.open();
      await tab.goto("/form");
      await tab.click("button");
      await tab.waitfor(() => tab.get("#submitted").exists());
      assert(tab.get("#submitted").exists()).true();
    });

    test.case("url-bound form shows field error", async assert => {
      await using tab = await browser.open();
      await tab.goto("/form");
      await tab.set("input[type=number]", "21");
      await tab.click("button");
      await tab.waitfor(() => tab.get("#counter-error").exists());
      assert(tab.get("#counter-error").text()).equals("21 is out of range");
    });

    test.case("field increments and shows error at limit", async assert => {
      await using tab = await browser.open();
      await tab.goto("/counter");

      // starts at 10, click + 10 times to reach 20
      for (let i = 0; i < 10; i++) {
        const expected = String(11 + i);
        await tab.click("button:last-of-type");
        await tab.waitfor(() => tab.get("span").text() === expected);
      }
      assert(tab.get("span").text()).equals("20");
      assert(tab.get("p").exists()).false();

      // one more push over the limit
      await tab.click("button:last-of-type");
      await tab.waitfor(() => tab.get("p").exists());
      assert(tab.get("p").exists()).true();
    });

    test.case("action form shows form-level error", async assert => {
      await using tab = await browser.open();
      await tab.goto("/route-client/form-level");
      await tab.set("#foo", "invalid");
      await tab.click("#send");
      await tab.waitfor(() => tab.get("#error").exists());
      assert(tab.get("#error").exists()).true();
    });

    test.case("action form succeeds with valid value", async assert => {
      await using tab = await browser.open();
      await tab.goto("/route-client/form-level");
      await tab.set("#foo", "valid");
      await tab.click("#send");
      await tab.waitfor(() => tab.get("#result").exists());
      assert(tab.get("#result").text()).equals("ok");
    });
  }

  test.case("navigation preserves query string", async assert => {
    await using tab = await browser.open();
    await tab.goto("/link-with-query");
    await tab.click("#link");
    assert(tab.window.location.search).equals("?foo=bar");
  });

  return browser;
}

export default frontend;
