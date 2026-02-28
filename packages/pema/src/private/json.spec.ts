import p from "#index";
import test from "@rcompat/test";

// p.json() — opaque JSONValue
test.case("accepts any json value", assert => {
  assert(p.json().parse({ a: 1, b: [true, "x"] }))
    .equals({ a: 1, b: [true, "x"] });
});

test.case("accepts primitive string", assert => {
  assert(p.json().parse("hello")).equals("hello");
});

test.case("accepts primitive number", assert => {
  assert(p.json().parse(42)).equals(42);
});

test.case("accepts primitive float", assert => {
  assert(p.json().parse(3.14)).equals(3.14);
});

test.case("accepts primitive boolean true", assert => {
  assert(p.json().parse(true)).equals(true);
});

test.case("accepts primitive boolean false", assert => {
  assert(p.json().parse(false)).equals(false);
});

test.case("accepts empty object", assert => {
  assert(p.json().parse({})).equals({});
});

test.case("accepts empty array", assert => {
  assert(p.json().parse([])).equals([]);
});

test.case("accepts nested object", assert => {
  const value = { outer: { inner: { deep: true } } };
  assert(p.json().parse(value)).equals(value);
});

test.case("accepts array at root", assert => {
  const value = [1, "two", false, null];
  assert(p.json().parse(value)).equals(value);
});

test.case("accepts null inside object", assert => {
  assert(p.json().parse({ a: 1, b: null })).equals({ a: 1, b: null });
});

test.case("accepts null inside array", assert => {
  assert(p.json().parse([1, null, "three"])).equals([1, null, "three"]);
});

test.case("rejects non-json value (bigint)", assert => {
  assert(() => p.json().parse({ a: 1n })).throws();
});

test.case("rejects non-json value (Date)", assert => {
  assert(() => p.json().parse({ a: new Date() })).throws();
});

test.case("rejects non-json value (URL)", assert => {
  assert(() => p.json().parse({ a: new URL("https://example.com") })).throws();
});

test.case("rejects undefined", assert => {
  assert(() => p.json().parse(undefined)).throws();
});

// p.json() datatype
test.case("p.json() has datatype json", assert => {
  assert(p.json().datatype).equals("json");
});

test.case("p.json(schema) has datatype json", assert => {
  assert(p.json(p({ x: p.string })).datatype).equals("json");
});

// p.json(ObjectType) — strongly typed object
test.case("json(object schema) validates against inner schema", assert => {
  const schema = p.json(p({ cart: p.array(p.string) }));
  assert(schema.parse({ cart: ["a", "b"] }))
    .equals({ cart: ["a", "b"] })
    .type<{ cart: string[] }>();
});

test.case("p.json(object schema) rejects invalid inner data", assert => {
  const schema = p.json(p({ cart: p.array(p.string) }));
  assert(() => schema.parse({ cart: [1, 2] })).throws();
});

test.case("p.json(object schema) rejects missing required field", assert => {
  const schema = p.json(p({ cart: p.array(p.string) }));
  assert(() => schema.parse({})).throws();
});

// p.json(ArrayType) — strongly typed array
test.case("json(array schema) validates array of strings", assert => {
  const schema = p.json(p.array(p.string));
  assert(schema.parse(["a", "b", "c"]))
    .equals(["a", "b", "c"])
    .type<string[]>();
});

test.case("json(array schema) validates array of objects", assert => {
  const schema = p.json(p.array(p({ title: p.string, views: p.u32 })));
  const value = [{ title: "First", views: 42 }];
  assert(schema.parse(value))
    .equals(value)
    .type<{ title: string; views: number }[]>();
});

test.case("json(array schema) rejects invalid elements", assert => {
  const schema = p.json(p.array(p.string));
  assert(() => schema.parse([1, 2, 3])).throws();
});

test.case("json(array schema) accepts empty array", assert => {
  const schema = p.json(p.array(p.string));
  assert(schema.parse([])).equals([]).type<string[]>();
});

// p.json(string) — typed primitive
test.case("json(p.string) validates string", assert => {
  const schema = p.json(p.string);
  assert(schema.parse("hello")).equals("hello").type<string>();
});

test.case("json(p.string) rejects non-string", assert => {
  const schema = p.json(p.string);
  assert(() => schema.parse(42)).throws();
});

// p.json(number) — typed primitive
test.case("json(p.number) validates number", assert => {
  const schema = p.json(p.number);
  assert(schema.parse(42)).equals(42).type<number>();
});

// p.json(boolean) — typed primitive
test.case("json(p.boolean) validates boolean", assert => {
  const schema = p.json(p.boolean);
  assert(schema.parse(true)).equals(true).type<boolean>();
});

// optional and default
test.case("p.json().optional() works", assert => {
  const schema = p.json().optional();
  assert(schema.parse(undefined)).equals(undefined);
  assert(schema.parse({ x: 1 })).equals({ x: 1 });
});

test.case("p.json(schema).optional() works", assert => {
  const schema = p.json(p({ x: p.number })).optional();
  assert(schema.parse(undefined)).equals(undefined);
  assert(schema.parse({ x: 1 })).equals({ x: 1 });
  //    .type<{ x: number } | undefined>();
});

test.case("p.json(schema).default() works", assert => {
  const schema = p.json(p({ x: p.number })).default({ x: 0 });
  assert(schema.parse(undefined)).equals({ x: 0 }).type<{ x: number }>();
  assert(schema.parse({ x: 5 })).equals({ x: 5 });
});

test.case("p.json(array schema).default() works", assert => {
  const schema = p.json(p.array(p.string)).default([]);
  assert(schema.parse(undefined)).equals([]).type<string[]>();
});

// nested json schemas
test.case("json(nested object schema) validates deeply", assert => {
  const schema = p.json(p({
    user: p({ name: p.string, age: p.u8 }),
    tags: p.array(p.string),
  }));
  const value = { user: { name: "John", age: 30 }, tags: ["a", "b"] };
  assert(schema.parse(value))
    .equals(value)
    .type<{ user: { name: string; age: number }; tags: string[] }>();
});

// compile-time negative tests
test.case("p.json rejects non-json-safe types at compile time", assert => {
  // @ts-expect-error bigint is not JSONValue
  p.json(p({ count: p.bigint }));
  // @ts-expect-error Date is not JSONValue
  p.json(p({ created: p.date }));
  // @ts-expect-error URL is not JSONValue
  p.json(p({ link: p.url }));
  // @ts-expect-error i64 is not JSONValue
  p.json(p({ big: p.i64 }));
  // @ts-expect-error u128 is not JSONValue
  p.json(p({ huge: p.u128 }));
  assert(true).true();
});
