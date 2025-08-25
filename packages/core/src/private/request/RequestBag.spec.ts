import RequestBag from "#request/RequestBag";
import test from "@rcompat/test";
import any from "@rcompat/test/any";
import undef from "@rcompat/test/undef";

const toLower = (k: string) => k.toLowerCase();

/** helper to build a bag quickly */
function bag(
  input: Record<string, string | undefined>,
  name = "test",
  raw = "",
  normalize?: (k: string) => string,
) {
  return new RequestBag(input, name, { normalize, raw });
}

test.case("construct: raw and name are set; toString mirrors raw", assert => {
  const b = bag({ a: "1" }, "query", "?a=1");
  assert(b.raw).equals("?a=1");
  assert(b.toString()).equals("?a=1");
});

test.case("normalization: toLower with last-wins on collisions", assert => {
  const b = bag({ BAR: "x", Foo: "1", foo: "2" }, "headers", "", toLower);

  // size counts keys post-normalization (Foo collides with foo -> last-wins)
  assert(b.size).equals(2);

  // collision resolved to last value
  assert(b.get("FOO")).equals("2");
  assert(b.get("foo")).equals("2");

  // unrelated key normalized
  assert(b.get("bar")).equals("x");
});

test.case("size: counts keys even when value is undefined (Map semantics)", assert => {
  const b = bag({ a: "1", b: undef, c: "3" });

  // a, b, c -> 3 keys total
  assert(b.size).equals(3);
});

test.case("iterator: yields only defined entries, normalized keys", assert => {
  const b = bag({ A: "1", b: undef, c: "3" }, "x", "", toLower);

  const seen = [...b]; // uses [Symbol.iterator]
  assert(seen).equals([["a", "1"], ["c", "3"]]);
});

test.case("get: returns value when defined; throws when absent or undefined", assert => {
  const b = bag({ present: "yes", undef: undef });

  assert(b.get("present")).equals("yes");

  assert(() => b.get("missing")).throws();
  assert(() => b.get("undef")).throws();
});

test.case("try: returns value or undefined (no throw)", assert => {
  const b = bag({ present: "yes", undef: undef });

  assert(b.try("present")).equals("yes");
  assert(b.try("missing")).undefined();
  assert(b.try("undef")).undefined();
});

test.case("has: true only for defined values", assert => {
  const b = bag({ present: "yes", undef: undef });

  assert(b.has("present")).true();
  assert(b.has("missing")).false();
  assert(b.has("undef")).false();
});

test.case("parse: schema receives normalized contents", assert => {
  let received: unknown;

  const schema = {
    parse(input: unknown) {
      received = input;
      // return something transformed to prove delegation worked
      return { ok: true };
    },
  };

  const b = bag({ bar: "2", Foo: "1" }, "query", "?Foo=1&bar=2", toLower);
  const out = b.parse(schema);

  // output is whatever schema returned
  assert(out).equals({ ok: true });

  // schema saw normalized keys
  assert(received).equals(any({ bar: "2", foo: "1" }));
});

test.case("toJSON: returns a shallow null-prototype clone, independent from the bag", assert => {
  const b = bag({ key: "value" });

  const json = b.toJSON();

  // same visible content
  assert(json).equals({ key: "value" });

  // mutating the clone must not affect the bag
  json.key = "changed";
  assert(b.get("key")).equals("value");

  // adding to the clone doesn't add to the bag
  json.added = "x";
  assert(b.has("added")).false();
});

test.case("raw default: empty string when not provided", assert => {
  const b = bag({ x: "1" });
  assert(b.raw).equals("");
  assert(String(b)).equals("");
});
