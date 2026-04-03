import boolean from "#boolean";
import type BooleanType from "#BooleanType";
import type DefaultType from "#DefaultType";
import type OptionalType from "#OptionalType";
import test from "#test";

test.case("fail", assert => {
  assert(boolean).invalid_type(["true", "false", 0, 1, null, undefined]);
});

test.case("pass", assert => {
  assert(boolean).type<BooleanType>();
  assert(boolean.parse(true)).equals(true).type<boolean>();
  assert(boolean.parse(false)).equals(false).type<boolean>();
});

test.case("coerce", assert => {
  assert(boolean.coerce(true)).equals(true).type<boolean>();
  assert(boolean.coerce(false)).equals(false).type<boolean>();
  assert(boolean.coerce("true")).equals(true).type<boolean>();
  assert(boolean.coerce("false")).equals(false).type<boolean>();
  assert(boolean).invalid_type(["1", "0", null, undefined]);
});

test.case("default", assert => {
  [boolean.default(true), boolean.default(() => true)].forEach(d => {
    assert(d).type<DefaultType<BooleanType, true>>();
    assert(d.parse(undefined)).equals(true).type<boolean>();
    assert(d.parse(true)).equals(true).type<boolean>();
    assert(d.parse(false)).equals(false).type<boolean>();
    assert(d).invalid_type(["true"]);
  });
});

test.case("optional", assert => {
  const o = boolean.optional();
  assert(o).type<OptionalType<BooleanType>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse(true)).equals(true).type<boolean>();
  assert(o.parse(false)).equals(false).type<boolean>();
  assert(o).invalid_type(["true"]);
});

test.case("toJSON", assert => {
  assert(boolean.toJSON())
    .type<{ type: "boolean"; datatype: "boolean" }>()
    .equals({ type: "boolean", datatype: "boolean" })
    ;
});
