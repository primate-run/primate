import setup from "#setup";
import fn from "@rcompat/fn";
import http from "@rcompat/http";
import test from "@rcompat/test";
import type { Dict } from "@rcompat/type";

function multipart(body: unknown) {
  // Accept either a prebuilt FormData or a plain object
  if (body instanceof FormData) {
    return body;
  } else {
    const fd = new FormData();
    for (const [k, v] of Object.entries(body ?? {})) {
      // Strings like a real form; files/blobs should be appended by caller
      fd.append(k, v == null ? "" : String(v));
    }
    return fd;
  }
}

function backend(dirname: string) {
  const browser = setup(dirname);

  test.ended(async () => {
    await browser.close();
  });

  test.group("request", () => {
    test.case("url.pathname", async assert => {
      await using tab = await browser.open();
      assert(await tab.text("/request/pathname")).equals("/request/pathname");
    });
  });

  test.case("request", async assert => {
    await using tab = await browser.open();
    assert(await tab.text("/request/query?foo=bar")).equals("bar");
    assert(await tab.text("/request/query?bar=foo")).equals("foo missing");
    assert(await tab.json("/request/validate-query?foo=bar&baz=1"))
      .equals({ foo: "bar", baz: 1 });
    assert(await tab.text("/request/validate-query?foo=bar&baz=foo"))
      .equals("parsing failed for field 'baz': cannot parse 'foo' as integer");
  });

  test.case("redirected", async assert => {
    await using tab = await browser.open();
    assert(await tab.text("/redirected")).equals("Redirected!");
  });

  test.group("body", () => {
    type Case = {
      name: string;
      mime: string;
      body: unknown;
      serializer: (x: any) => BodyInit;
      accessor: "text" | "json";
    };

    const cases: Case[] = [
      {
        name: "text",
        mime: http.MIME.TEXT_PLAIN,
        body: "Hi!",
        serializer: fn.identity,
        accessor: "text",
      },
      {
        name: "json",
        mime: http.MIME.APPLICATION_JSON,
        body: { foo: "bar", baz: 1 },
        serializer: JSON.stringify,
        accessor: "json",
      },
      {
        name: "form",
        mime: http.MIME.APPLICATION_X_WWW_FORM_URLENCODED,
        body: { foo: "bar", baz: "1" },
        serializer: (x: any) => new URLSearchParams(x).toString(),
        accessor: "json",
      },
      {
        name: "multipart",
        mime: http.MIME.MULTIPART_FORM_DATA,
        body: { foo: "bar", baz: "1" },
        serializer: (body: unknown) => multipart(body),
        accessor: "json",
      },
      {
        name: "multipart-file",
        mime: http.MIME.MULTIPART_FORM_DATA,
        body: {
          baz: 1,
          foo: "bar",
          greeting: {
            content: "Hello from a file!",
            name: "greeting.txt",
            size: 18,
            type: "text/plain",
          },
        },
        serializer: (x: any) => {
          const fd = new FormData();
          fd.append("baz", String(x.baz));
          fd.append("foo", x.foo);
          fd.append(
            "greeting",
            new File([x.greeting.content], x.greeting.name, { type: x.greeting.type }),
          );
          return fd;
        },
        accessor: "json",
      },
      {
        name: "blob",
        mime: http.MIME.APPLICATION_OCTET_STREAM,
        body: {
          head: [222, 173, 190, 239],
          size: 6,
          type: "application/octet-stream",
        },
        serializer: (x: any) => new Uint8Array([...x.head, 0x00, 0x01]),
        accessor: "json",
      },
    ];

    const method = "POST";
    for (const { name, mime, body, serializer, accessor } of cases) {
      test.case(name, async assert => {
        await using tab = await browser.open();
        const headers: Dict<string> = {};
        if (mime !== http.MIME.MULTIPART_FORM_DATA) {
          headers["Content-Type"] = mime;
        }
        const response = await tab.fetch(`/body/${name}`, {
          method,
          body: serializer(body),
          headers,
        });
        assert(await response[accessor]()).equals(body);
      });
    }
  });

  test.group("response", () => {
    const cases: {
      as: "text" | "json";
      type: string;
      expected: unknown;
    }[] = [
        { as: "text", type: "string", expected: "Hello, world!" },
        { as: "json", type: "array", expected: [{ foo: "bar" }, { foo: 1 }] },
        { as: "json", type: "tuple", expected: [{ foo: "bar" }, { foo: 1 }] },
        { as: "json", type: "dict", expected: { foo: "bar", bar: 1 } },
      ];
    for (const { as, type, expected } of cases) {
      test.case(type, async assert => {
        await using tab = await browser.open();
        assert(await tab[as](`/response/${type}`)).equals(expected);
      });
    }
    test.case("null", async assert => {
      await using tab = await browser.open();
      assert((await tab.fetch("/response/null")).status)
        .equals(http.Status.NO_CONTENT);
    });
  });

  test.case("response", async assert => {
    await using tab = await browser.open();

    const r_error = await tab.fetch("/response/error");
    assert(r_error.status).equals(http.Status.NOT_FOUND);

    await tab.goto("/response/error-body");

    const r_redirect = await tab.fetch("/response/redirect", {
      redirect: "manual",
    });
    assert(r_redirect.status).equals(http.Status.FOUND);
    assert(r_redirect.headers.get("Location")).equals("/redirected");

    const r_redirect_status = await tab.fetch("/response/redirect-status", {
      redirect: "manual",
    });
    assert(r_redirect_status.status).equals(http.Status.MOVED_PERMANENTLY);
    assert(r_redirect_status.headers.get("Location")).equals("/redirected");

    await tab.goto("/response/view");
    const inner = "<h1>View</h1> Hello, world.";
    assert(tab.select("body")?.textContent).nequals("");
    assert(tab.select("div")?.innerHTML).equals(inner);

  });

  test.case("partial view", async assert => {
    await using tab = await browser.open();
    const r = await tab.fetch("/response/view-partial");
    const text = await r.text();
    const inner = "<h1>View</h1> Hello, world.";
    assert(text.includes(`<div>${inner}</div>`)).true();
    assert(text.includes("<html>")).false();
    assert(text.includes("<body>")).false();
  });

  test.case("session", async assert => {
    await using tab = await browser.open();
    const response = await tab.fetch("/session");
    const set_cookie = response.headers.get("Set-Cookie");
    assert(set_cookie?.includes("session_id=")).true();
    assert(await response.json()).equals({ foo: "bar" });
  });

  test.group("i18n", () => {
    test.case("t", async assert => {
      await using tab = await browser.open();
      const expected = "Hi John, would you like 5 apples?";
      assert(await tab.text("/i18n/t")).equals(expected);
    });

    test.case("locale", async assert => {
      await using tab = await browser.open();
      assert(await tab.text("/i18n/locale")).equals("en-US");
    });
  });

  return browser;
}

export default backend;
