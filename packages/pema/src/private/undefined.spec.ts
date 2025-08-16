import expect from "#expect";
import type_undefined from "#undefined";
import test from "@rcompat/test";

test.case("fail", assert => {
  assert(() => type_undefined.parse(null)).throws(expect("u", null));
});

test.case("pass", assert => {
  assert(type_undefined).type<"UndefinedType">();
  assert(type_undefined.parse(undefined)).equals(undefined)
    .type<undefined>();
});
