import number from "#number";
import partial from "#partial";
import string from "#string";
import test from "#test";

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
  assert(p).parse_issues({ foo: 1, n: "x" }, [
    { type: "invalid_type", path: "/foo" },
    { type: "invalid_type", path: "/n" },
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
  assert(p).parse_issues({ foo: 42 }, [
    { type: "invalid_type", path: "/foo", message: "kaboom" },
  ]);
});

// NEW: rejects non-object input with a proper ParseError at root
test.case("partial rejects non-object input", assert => {
  const p = partial({ foo: string });
  assert(p).invalid_type(["nope"]);
});
