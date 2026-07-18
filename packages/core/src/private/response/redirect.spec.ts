import redirect from "#response/redirect";
import test from "@rcompat/test";

const app = {
  respond(body: BodyInit | null, init?: ResponseInit) {
    return new Response(body, init);
  },
};

const requestURL = "https://app.example/current?from=test";

function render(handler: any, url = requestURL): Response {
  return handler(app, {}, { url: new URL(url) }) as Response;
}

function location(handler: any, url = requestURL): string {
  return render(handler, url).headers.get("Location")!;
}

function rejects(assert: any, create: () => unknown) {
  assert(create).throws(Error);
}

function hasForbiddenControl(value: string) {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

test.case("redirect.local accepts origin-relative targets", assert => {
  const cases = [
    ["/", "/"],
    ["/account", "/account"],
    ["/account/profile", "/account/profile"],
    ["/account?tab=security", "/account?tab=security"],
    ["/account#sessions", "/account#sessions"],
    ["/a%20b", "/a%20b"],
    ["/café?term=✓", "/caf%C3%A9?term=%E2%9C%93"],
  ];

  for (const [target, expected] of cases) {
    assert(location((redirect as any).local(target))).equals(expected);
  }
});

test.case("redirect callable remains a local-safe compatibility alias", assert => {
  assert(location((redirect as any)("/account", 303))).equals("/account");
  assert(render((redirect as any)("/account", 303)).status).equals(303);
  rejects(assert, () => (redirect as any)("https://evil.example"));
});

test.case("redirect.local rejects malformed and ambiguous targets", assert => {
  const targets = [
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "/\\\\evil.example",
    "/%5cevil.example",
    "/%5Cevil.example",
    "/..//evil.example",
    "/%2e%2e//evil.example",
    "/%2E%2E//evil.example",
    "https://evil.example",
    "http://evil.example",
    "https://app.example@evil.example",
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///tmp/test",
    " leading-space",
    "/trailing-space ",
    "/embedded\rreturn",
    "/embedded\nnewline",
    "/embedded\0nul",
  ];

  for (const target of targets) {
    rejects(assert, () => (redirect as any).local(target));
  }
});

test.case("redirect.local serializes structured query values", assert => {
  const emitted = location((redirect as any).local({
    pathname: "/検索",
    query: {
      amp: "&",
      equals: "=",
      question: "?",
      hash: "#",
      percent: "%",
      space: "a b",
      unicode: "✓",
      false: false,
      zero: 0,
      empty: "",
      nullish: null,
      missing: undefined,
      repeated: ["one", "two&", null, undefined, 0, false],
    },
    hash: "結果",
  }));

  assert(emitted).equals(
    "/%E6%A4%9C%E7%B4%A2?amp=%26&equals=%3D&question=%3F&hash=%23&percent=%25&space=a+b&unicode=%E2%9C%93&false=false&zero=0&empty=&repeated=one&repeated=two%26&repeated=0&repeated=false#%E7%B5%90%E6%9E%9C",
  );
});

test.case("redirect.local validates status codes at runtime", assert => {
  for (const status of [301, 302, 303, 307, 308]) {
    assert(render((redirect as any).local("/ok", { status })).status).equals(status);
  }
  for (const status of [300, 304, 305, 306, 309, 399, 200]) {
    rejects(assert, () => (redirect as any).local("/no", { status }));
  }
});

test.case("redirect.local enforces serialized Location byte limits", assert => {
  const target = { pathname: "/é" };
  assert(location((redirect as any).local(target, { maxLocationBytes: 7 })))
    .equals("/%C3%A9");
  rejects(assert, () => (redirect as any).local(target, { maxLocationBytes: 6 }));
});

test.case("redirect headers cannot override validated Location", assert => {
  const response = render((redirect as any).local("/safe", {
    headers: {
      "Cache-Control": "private",
      "Content-Length": "123",
      Location: "//evil.example",
      "X-Test": "present",
    },
  }));

  assert(response.headers.get("Location")).equals("/safe");
  assert(response.headers.get("Content-Length")).equals("0");
  assert(response.headers.get("Cache-Control")).equals("private");
  assert(response.headers.get("X-Test")).equals("present");

  const defaults = render((redirect as any).local("/safe"));
  assert(defaults.headers.get("Cache-Control")).equals("no-cache");
});

test.case("redirect.external requires exact authorized HTTP origins", assert => {
  const external = (redirect as any).external;
  const allowedOrigins = ["https://trusted.example"];

  assert(location(external("https://trusted.example/path?x=1#done", {
    allowedOrigins,
  }))).equals("https://trusted.example/path?x=1#done");
  assert(location(external("https://trusted.example/path", {
    allowedOrigins,
  }))).equals("https://trusted.example/path#");

  for (const target of [
    "https://sub.trusted.example/path",
    "https://trusted.example.evil/path",
    "https://eviltrusted.example/path",
    "https://user:secret@trusted.example/path",
    "https://user@trusted.example/path",
    "http://trusted.example/path",
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///tmp/test",
    "blob:https://trusted.example/id",
    "ftp://trusted.example/file",
    "mailto:user@trusted.example",
    "https://unlisted.example/path",
  ]) {
    rejects(assert, () => external(target, { allowedOrigins }));
  }
});

test.case("redirect.external makes HTTP and method preservation explicit", assert => {
  const external = (redirect as any).external;

  assert(location(external("http://localhost:3000/dev", {
    allowedOrigins: ["http://localhost:3000"],
    allowHttp: true,
  }))).equals("http://localhost:3000/dev#");

  for (const status of [307, 308]) {
    rejects(assert, () => render(external("https://trusted.example/post", {
      allowedOrigins: ["https://trusted.example"],
      status,
    })));

    assert(render(external("https://trusted.example/post", {
      allowedOrigins: ["https://trusted.example"],
      preserveMethod: true,
      status,
    })).status).equals(status);
  }
});

test.case("accepted local redirects preserve origin invariants", assert => {
  const parts = [
    "", "a", ".", "..", "%2e", "%2E", "%2f", "%5c", "\\", "✓",
    "?x=&y=%", "#fragment", "\r", "\n", "\0",
  ];
  const prefixes = ["/", "//", "/a/", "/../", "/%2e%2e/"];
  let accepted = 0;

  for (const prefix of prefixes) {
    for (const first of parts) {
      for (const second of parts.slice(0, 8)) {
        let emitted: string;
        try {
          const response = render((redirect as any).local(
            prefix + first + second,
          ));
          emitted = response.headers.get("Location")!;
        } catch {
          // Rejection is valid; the property applies to every accepted target.
          continue;
        }

        accepted++;
        assert(new URL(emitted, requestURL).origin)
          .equals(new URL(requestURL).origin);
        assert(emitted.startsWith("/")).true();
        assert(emitted.startsWith("//")).false();
        assert(emitted.includes("\\")).false();
        assert(hasForbiddenControl(emitted)).false();
        assert(new TextEncoder().encode(emitted).byteLength <= 2048).true();
      }
    }
  }

  assert(accepted > 0).true();
});
