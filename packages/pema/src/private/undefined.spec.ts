import test from "#test";
import $undefined from "#undefined";
import type UndefinedType from "#UndefinedType";
import type DefaultType from "#DefaultType";
import type OptionalType from "#OptionalType";

test.case("fail", assert => {
  assert($undefined).invalid_type([null, 0, "", false, "undefined"]);
});

test.case("pass", assert => {
  assert($undefined).type<UndefinedType>();
  assert($undefined.parse(undefined)).equals(undefined).type<undefined>();
});

test.case("default", assert => {
  const d = $undefined.default(undefined);
  assert(d).type<DefaultType<UndefinedType, undefined>>();
  assert(d.parse(undefined)).equals(undefined).type<undefined>();
});

test.case("optional", assert => {
  const o = $undefined.optional();
  assert(o).type<OptionalType<UndefinedType>>();
  assert(o.parse(undefined)).equals(undefined);
});

test.case("toJSON", assert => {
  assert($undefined.toJSON())
    .type<{ type: "undefined" }>()
    .equals({ type: "undefined" });
});
