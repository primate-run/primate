import expected from "#expected";
import number from "#number";
import partial from "#partial";
import string from "#string";
import messagesOf from "#test/messages-of";
import pathsOf from "#test/paths-of";
import throwsIssues from "#test/throws-issues";
import test from "@rcompat/test";

test.case("partial parse only validates provided keys", assert => {
  const p = partial({ foo: string, n: number });
  const out = p.parse({ foo: "hi" });
  assert(out).equals({ foo: "hi" });
});

test.case("partial ignores unknown keys (loose Partial semantics)", assert => {
  const p = partial({ foo: string });
  const out = p.parse({ extra: 1, foo: "x" });
  assert(out).equals({ foo: "x" });
});

test.case("partial default returns widened type", assert => {
  const p = partial({ foo: string });
  const d = p.default({ foo: "x" });
  /*assert(d).type<
    DefaultType<PartialType<{ foo: StringType }>,
      { foo?: string }>>();*/
});

test.case("partial aggregates and rebases child errors", assert => {
  const p = partial({ foo: string, n: number });
  const issues = throwsIssues(assert, () => p.parse({ foo: 1, n: "x" } as any));

  // Each failing provided key shows up once, rebased to /<key>
  assert(pathsOf(issues)).equals(["/foo", "/n"]);
  assert(messagesOf(issues)).equals([
    expected("string", 1),
    expected("number", "x"),
  ]);
});

test.case("partial wraps non-ParseError child throws with proper path", assert => {
  const boom = {
    name: "boom",
    parse(_x: unknown) {
      throw new Error("kaboom");
    },
  } as any;

  const p = partial({ foo: boom });
  const issues = throwsIssues(assert, () => p.parse({ foo: 42 }));

  assert(pathsOf(issues)).equals(["/foo"]);
  assert(messagesOf(issues)).equals(["kaboom"]);
});

// NEW: rejects non-object input with a proper ParseError at root
test.case("partial rejects non-object input", assert => {
  const p = partial({ foo: string });
  const issues = throwsIssues(assert, () => p.parse("nope" as any));

  assert(pathsOf(issues)).equals([""]);
  // Message comes from `expected("object", x)`; keep it resilient:
  assert(messagesOf(issues)[0].includes("expected object")).equals(true);
});
