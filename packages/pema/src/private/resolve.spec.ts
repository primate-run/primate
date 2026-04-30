import number from "#number";
import object from "#object";
import string from "#string";
import test from "#test";
import symbol from "@rcompat/symbol";

const parsable = {
  [symbol.parse]() {
    return { name: "John", age: 30 };
  },
};

test.case("resolve: object with symbol.parse is unwrapped", assert => {
  const schema = object({ name: string, age: number });
  assert(schema.parse(parsable)).equals({ name: "John", age: 30 });
});

test.case("resolve: primitive schema sees unwrapped value", assert => {
  const str_bag = { [symbol.parse]() { return "hello"; } };
  assert(string.parse(str_bag)).equals("hello");
});

test.case("resolve: plain value passes through unchanged", assert => {
  assert(string.parse("hello")).equals("hello");
  assert(number.parse(42)).equals(42);
});
