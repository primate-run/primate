import constructor from "#constructor";
import type ConstructorType from "#ConstructorType";
import type DefaultType from "#DefaultType";
import test from "@rcompat/test";
import expect from "#expect";

test.case("fail", assert => {
  class Foo {};
  const c = constructor(Foo);

  assert(() => c.validate("1")).throws(expect("co", "1"));
});

test.case("pass", assert => {
  class Foo {};

  const c = constructor(Foo);
  const f = new Foo();

  assert(c).type<ConstructorType<typeof Foo>>();
  assert(c.validate(f)).equals(f).type<Foo>();
});

test.case("default", assert => {
  class Foo {};

  const f = new Foo();
  const f1 = new Foo();

  [constructor(Foo).default(f), constructor(Foo).default(() => f)].map(d => {
    assert(d).type<DefaultType<ConstructorType<typeof Foo>, Foo>>();
    assert(d.validate(undefined)).equals(f).type<Foo>();
    assert(d.validate(f)).equals(f).type<Foo>();
    assert(d.validate(f1)).equals(f1).type<Foo>();
    assert(() => d.validate(1)).throws(expect("co", 1));
  });
});

