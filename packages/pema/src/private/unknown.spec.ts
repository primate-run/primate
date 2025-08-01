import unknown from "#unknown";
import type UnknownType from "#UnknownType";
import test from "@rcompat/test";

test.case("pass", assert => {
  assert(unknown).type<UnknownType>();
  assert(unknown.validate("test")).equals("test").type<unknown>();
});
