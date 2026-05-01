import p from "#index";
import test from "#test";
import type UnknownType from "#UnknownType";

test.case("pass", assert => {
  assert(p.unknown).type<UnknownType>();
  assert(p.unknown.parse("test")).equals("test").type<unknown>();
});
