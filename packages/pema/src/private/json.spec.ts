import p from "#index";
import test from "@rcompat/test";

// p.json() — opaque JSONValue
test.case("accepts any json value", assert => {
  assert(p.json().parse({ a: 1, b: [true, "x"] }))
    .equals({ a: 1, b: [true, "x"] });
});

test.case("rejects non-json value", assert => {
  assert(() => p.json().parse({ a: 1n })).throws();
});

// p.json(schema) — strongly typed
test.case("json(schema) validates against inner schema", assert => {
  const schema = p.json(p({ cart: p.array(p.string) }));
  assert(schema.parse({ cart: ["a", "b"] }))
    .equals({ cart: ["a", "b"] })
    .type<{ cart: string[] }>();
});

test.case("p.json(schema) rejects invalid inner data", assert => {
  const schema = p.json(p({ cart: p.array(p.string) }));
  assert(() => schema.parse({ cart: [1, 2] })).throws();
});

test.case("p.json() has datatype json", assert => {
  assert(p.json().datatype).equals("json");
});

test.case("p.json(schema).optional() works", assert => {
  const schema = p.json(p({ x: p.number })).optional();
  assert(schema.parse(undefined)).equals(undefined);
  assert(schema.parse({ x: 1 })).equals({ x: 1 }).type<{ x: number }>();
});

test.case("p.json(schema).default() works", assert => {
  const schema = p.json(p({ x: p.number })).default({ x: 0 });
  assert(schema.parse(undefined)).equals({ x: 0 }).type<{ x: number }>();
});

// compile-time negative tests
test.case("p.json rejects non-json-safe types", assert => {
  // @ts-expect-error bigint is not JSONValue
  p.json(p({ count: p.bigint }));

  // @ts-expect-error Date is not JSONValue
  p.json(p({ created: p.date }));

  // @ts-expect-error URL is not JSONValue
  p.json(p({ link: p.url }));

  assert(true).true();
});
