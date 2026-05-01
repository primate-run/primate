import type DefaultType from "#DefaultType";
import p from "#index";
import type OptionalType from "#OptionalType";
import test from "#test";
import type UndefinedType from "#UndefinedType";

test.case("fail", assert => {
  assert(p.undefined).invalid_type([null, 0, "", false, "undefined"]);
});

test.case("pass", assert => {
  assert(p.undefined).type<UndefinedType>();
  assert(p.undefined.parse(undefined)).equals(undefined).type<undefined>();
});

test.case("default", assert => {
  const d = p.undefined.default(undefined);
  assert(d).type<DefaultType<UndefinedType, undefined>>();
  assert(d.parse(undefined)).equals(undefined).type<undefined>();
});

test.case("optional", assert => {
  const o = p.undefined.optional();
  assert(o).type<OptionalType<UndefinedType>>();
  assert(o.parse(undefined)).equals(undefined);
});

test.case("toJSON", assert => {
  assert(p.undefined.toJSON())
    .type<{ type: "undefined" }>()
    .equals({ type: "undefined" });
});
