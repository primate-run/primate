import transport from "#client/transport";
import test from "@rcompat/test";

const location = new URL("https://app.example/current");

async function withBrowser(
  fetcher: typeof fetch,
  run: () => Promise<void>,
) {
  const originalFetch = globalThis.fetch;
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "location");
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: location,
  });
  globalThis.fetch = fetcher;
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    if (descriptor === undefined) {
      delete (globalThis as any).location;
    } else {
      Object.defineProperty(globalThis, "location", descriptor);
    }
  }
}

function redirectResponse(status: number, target: string) {
  return new Response(null, { headers: { Location: target }, status });
}

test.case("client follows only exact redirect statuses", async assert => {
  for (const status of [301, 302, 303, 307, 308]) {
    const paths: string[] = [];
    await withBrowser(async input => {
      paths.push(String(input));
      return paths.length === 1
        ? redirectResponse(status, "/next")
        : new Response("ok");
    }, async () => {
      const result = await transport.refetch("/start");
      assert(result.requested.pathname).equals("/next");
      assert(paths).equals(["/start", "/next"]);
    });
  }

  for (const status of [300, 304, 305, 306, 309, 399]) {
    const paths: string[] = [];
    await withBrowser(async input => {
      paths.push(String(input));
      return redirectResponse(status, "/next");
    }, async () => {
      const result = await transport.refetch("/start");
      assert(result.requested.pathname).equals("/start");
      assert(paths).equals(["/start"]);
    });
  }
});

test.case("client refuses cross-origin manual redirect hops", async assert => {
  const paths: string[] = [];
  await withBrowser(async input => {
    paths.push(String(input));
    return redirectResponse(302, "https://evil.example/next");
  }, async () => {
    const result = await transport.refetch("/start");
    assert(result.requested.pathname).equals("/start");
    assert(paths).equals(["/start"]);
  });
});

test.case("client parses Location only for redirect statuses", async assert => {
  await withBrowser(
    async () => new Response("ok", {
      headers: { Location: "http://[" },
      status: 200,
    }),
    async () => {
      const result = await transport.refetch("/start");
      assert(await result.response.text()).equals("ok");
    },
  );

  await withBrowser(
    async () => redirectResponse(302, "http://["),
    async () => {
      let message = "";
      try {
        await transport.refetch("/start");
      } catch (error) {
        if (error instanceof TypeError) message = error.message;
      }
      assert(message).equals("Invalid redirect Location");
    },
  );
});

test.case(
  "client constrains non-GET redirect following to same origin",
  async assert => {
    let seen: RequestInit | undefined;
    await withBrowser(async (_input, init) => {
      seen = init;
      const response = new Response("ok");
      Object.defineProperty(response, "url", {
        value: "https://app.example/done",
      });
      return response;
    }, async () => {
      const result = await transport.refetch("/start", {
        body: "secret=form-value",
        method: "POST",
        mode: "cors",
      });
      assert(seen?.method).equals("POST");
      assert(seen?.body).equals("secret=form-value");
      assert(seen?.mode).equals("same-origin");
      assert(seen?.redirect).equals("follow");
      assert(result.requested.pathname).equals("/done");
    });
  },
);

test.case("client enforces redirect hop limits", async assert => {
  let calls = 0;
  await withBrowser(async () => {
    calls++;
    return redirectResponse(302, `/hop-${calls}`);
  }, async () => {
    let message = "";
    try {
      await transport.refetch("/start", {}, 2);
    } catch (error) {
      message = (error as Error).message;
    }
    assert(message).equals("Too many redirects");
    assert(calls).equals(2);
  });
});
