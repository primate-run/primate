import constructor from "#constructor";
import type ConstructorType from "#ConstructorType";
import type DefaultType from "#DefaultType";
import expect from "#expect";
import test from "@rcompat/test";

test.case("fail", assert => {
  class Foo { };
  const c = constructor(Foo);

  assert(() => c.parse("1")).throws(expect("co", "1"));
});

test.case("pass", assert => {
  class Foo { };

  const c = constructor(Foo);
  const f = new Foo();

  assert(c).type<ConstructorType<typeof Foo>>();
  assert(c.parse(f)).equals(f).type<Foo>();
});

test.case("default", assert => {
  class Foo { };

  const f = new Foo();
  const f1 = new Foo();

  [constructor(Foo).default(f), constructor(Foo).default(() => f)].map(d => {
    assert(d).type<DefaultType<ConstructorType<typeof Foo>, Foo>>();
    assert(d.parse(undefined)).equals(f).type<Foo>();
    assert(d.parse(f)).equals(f).type<Foo>();
    assert(d.parse(f1)).equals(f1).type<Foo>();
    assert(() => d.parse(1)).throws(expect("co", 1));
  });
});

