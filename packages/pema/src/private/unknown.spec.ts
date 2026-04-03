import test from "#test";
import unknown from "#unknown";
import type UnknownType from "#UnknownType";

test.case("pass", assert => {
  assert(unknown).type<UnknownType>();
  assert(unknown.parse("test")).equals("test").type<unknown>();
});
