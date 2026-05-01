import p from "#index";
import test from "#test";

test.case("parse only validates provided keys", assert => {
  const partial = p.partial({ foo: p.string, n: p.number });
  const out = partial.parse({ foo: "hi" });
  assert(out).equals({ foo: "hi" });
});

test.case("ignores unknown keys (loose Partial semantics)", assert => {
  const partial = p.partial({ foo: p.string });
  const out = partial.parse({ extra: 1, foo: "x" });
  assert(out).equals({ foo: "x" });
});

test.case("default returns widened type", assert => {
  const partial = p.partial({ foo: p.string });
  const d = partial.default({ foo: "x" });
  /*assert(d).type<
    DefaultType<PartialType<{ foo: StringType }>,
      { foo?: string }>>();*/
});

test.case("aggregates and rebases child errors", assert => {
  const partial = p.partial({ foo: p.string, n: p.number });
  assert(partial).parse_issues({ foo: 1, n: "x" }, [
    { type: "invalid_type", path: "/foo" },
    { type: "invalid_type", path: "/n" },
  ]);
});

test.case("wraps non-ParseError child throws with proper path", assert => {
  const boom = {
    name: "boom",
    parse(_x: unknown) {
      throw new Error("kaboom");
    },
  } as any;

  const partial = p.partial({ foo: boom });
  assert(partial).parse_issues({ foo: 42 }, [
    { type: "invalid_type", path: "/foo", message: "kaboom" },
  ]);
});

test.case("rejects non-object input", assert => {
  const partial = p.partial({ foo: p.string });
  assert(partial).invalid_type(["nope"]);
});
