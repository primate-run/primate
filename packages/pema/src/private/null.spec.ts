import type DefaultType from "#DefaultType";
import p from "#index";
import type NullType from "#NullType";
import type OptionalType from "#OptionalType";
import test from "#test";

test.case("fail", assert => {
  assert(p.null).invalid_type([undefined, 0, "", false, "null"]);
});

test.case("pass", assert => {
  assert(p.null).type<NullType>();
  assert(p.null.parse(null)).equals(null).type<null>();
});

test.case("default", assert => {
  const d = p.null.default(null);
  assert(d).type<DefaultType<NullType, null>>();
  assert(d.parse(undefined)).equals(null).type<null>();
  assert(d.parse(null)).equals(null).type<null>();
});

test.case("optional", assert => {
  const o = p.null.optional();
  assert(o).type<OptionalType<NullType>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse(null)).equals(null).type<null>();
});

test.case("toJSON", assert => {
  assert(p.null.toJSON())
    .type<{ type: "null" }>()
    .equals({ type: "null" });
});
