import type BooleanType from "#BooleanType";
import type DefaultType from "#DefaultType";
import p from "#index";
import type OptionalType from "#OptionalType";
import test from "#test";

test.case("fail", assert => {
  assert(p.boolean).invalid_type(["true", "false", 0, 1, null, undefined]);
});

test.case("pass", assert => {
  assert(p.boolean).type<BooleanType>();
  assert(p.boolean.parse(true)).equals(true).type<boolean>();
  assert(p.boolean.parse(false)).equals(false).type<boolean>();
});

test.case("loose", assert => {
  assert(p.loose.boolean.parse(true)).equals(true).type<boolean>();
  assert(p.loose.boolean.parse(false)).equals(false).type<boolean>();
  assert(p.loose.boolean.parse("true")).equals(true).type<boolean>();
  assert(p.loose.boolean.parse("false")).equals(false).type<boolean>();
  assert(p.boolean).invalid_type(["1", "0", null, undefined]);
  assert(p.loose.boolean).invalid_type(["1", "0", null, undefined]);
});

test.case("default", assert => {
  [p.boolean.default(true), p.boolean.default(() => true)].forEach(d => {
    assert(d).type<DefaultType<BooleanType, true>>();
    assert(d.parse(undefined)).equals(true).type<boolean>();
    assert(d.parse(true)).equals(true).type<boolean>();
    assert(d.parse(false)).equals(false).type<boolean>();
    assert(d).invalid_type(["true"]);
  });
});

test.case("optional", assert => {
  const o = p.boolean.optional();
  assert(o).type<OptionalType<BooleanType>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse(true)).equals(true).type<boolean>();
  assert(o.parse(false)).equals(false).type<boolean>();
  assert(o).invalid_type(["true"]);
});

test.case("toJSON", assert => {
  assert(p.boolean.toJSON())
    .type<{ type: "boolean"; datatype: "boolean" }>()
    .equals({ type: "boolean", datatype: "boolean" })
    ;
});
