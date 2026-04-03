import pure from "#pure";
import test from "#test";

type Test = { foo: string };

test.case("no parsing", assert => {
  assert(pure<Test>().parse(1)).type<Test>().equals(1);
  const foobar = { foo: "bar" };
  assert(pure<Test>().parse(foobar)).type<Test>().equals(foobar);
});
