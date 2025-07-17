import unknown from "#unknown";
import test from "@rcompat/test";
import type UnknownType from "#UnknownType";

test.case("pass", assert => {
  assert(unknown).type<UnknownType>();
  assert(unknown.validate("test")).equals("test").type<unknown>();
});
