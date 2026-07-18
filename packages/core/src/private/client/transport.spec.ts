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

test.case("client rejects malformed Location values predictably", async assert => {
  await withBrowser(
    async () => redirectResponse(302, "http://["),
    async () => {
      let rejected = false;
      try {
        await transport.refetch("/start");
      } catch (error) {
        rejected = error instanceof TypeError;
      }
      assert(rejected).true();
    },
  );
});

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
