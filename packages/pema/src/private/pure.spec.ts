import pure from "#pure";
import test from "@rcompat/test";

type Test = { foo: string };

test.case("no validation", assert => {
  assert(pure<Test>().validate(1)).type<Test>().equals(1);
  assert(pure<Test>().validate({ foo: "bar" })).type<Test>()
    .equals({ foo: "bar" });
});
