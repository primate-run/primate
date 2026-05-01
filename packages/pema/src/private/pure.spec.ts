import p from "#index";
import test from "#test";

type Test = { foo: string };

test.case("no parsing", assert => {
  assert(p.pure<Test>().parse(1)).type<Test>().equals(1);
  const foobar = { foo: "bar" };
  assert(p.pure<Test>().parse(foobar)).type<Test>().equals(foobar);
});
