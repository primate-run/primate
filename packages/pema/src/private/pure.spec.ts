import pure from "#pure";
import test from "@rcompat/test";

type Test = { foo: string };

test.case("no parsing", assert => {
  assert(pure<Test>().parse(1)).type<Test>().equals(1);
  assert(pure<Test>().parse({ foo: "bar" })).type<Test>()
    .equals({ foo: "bar" });
});
