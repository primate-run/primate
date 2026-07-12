import type AsyncType from "#AsyncType";
import p from "#index";
import type StringType from "#StringType";
import test from "#test";

test.case("async", async assert => {
  const schema = p.async({ name: p.string });
  const parsed = schema.parse({ name: "John" });

  assert(schema).type<AsyncType<{ name: StringType }>>();
  assert(parsed instanceof Promise).true();
  assert(await parsed).equals({ name: "John" }).type<{ name: string }>();
});

test.case("derive", async assert => {
  const schema = p.async({
    first: p.string,
    last: p.string,
  }).derive(async value => `${value.first} ${value.last}`);

  assert(await schema.parse({ first: "John", last: "Adams" }))
    .equals("John Adams")
    .type<string>();
});

test.case("derive: chained", async assert => {
  const schema = p.async({ name: p.string })
    .derive(value => value.name)
    .derive(async name => name.length);

  assert(await schema.parse({ name: "John" })).equals(4).type<number>();
});
