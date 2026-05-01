import p from "#index";
import test from "#test";
import symbol from "@rcompat/symbol";

const parsable = {
  [symbol.parse]() {
    return { name: "John", age: 30 };
  },
};

test.case("resolve: object with symbol.parse is unwrapped", assert => {
  const schema = p.object({ name: p.string, age: p.number });
  assert(schema.parse(parsable)).equals({ name: "John", age: 30 });
});

test.case("resolve: primitive schema sees unwrapped value", assert => {
  const str_bag = { [symbol.parse]() { return "hello"; } };
  assert(p.string.parse(str_bag)).equals("hello");
});

test.case("resolve: plain value passes through unchanged", assert => {
  assert(p.string.parse("hello")).equals("hello");
  assert(p.number.parse(42)).equals(42);
});
