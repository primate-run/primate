import type DefaultType from "#DefaultType";
import is from "#is";
import type IsType from "#IsType";
import type OptionalType from "#OptionalType";
import test from "#test";

class Foo { }

const is_foo = (x: unknown): x is Foo => x instanceof Foo;

test.case("fail", assert => {
  const t = is(is_foo);

  assert(t).invalid_type(["1", null, 1]);
});

test.case("pass", assert => {
  const t = is(is_foo);
  const f = new Foo();

  assert(t).type<IsType<Foo>>();
  assert(t.parse(f)).equals(f).type<Foo>();
});

test.case("optional", assert => {
  const t = is(is_foo).optional();
  const f = new Foo();

  assert(t).type<OptionalType<IsType<Foo>>>();
  assert(t.parse(undefined)).equals(undefined);
  assert(t.parse(f)).equals(f);
});

test.case("default", assert => {
  const f = new Foo();
  const f1 = new Foo();

  [is(is_foo).default(f), is(is_foo).default(() => f)].map(d => {
    assert(d).type<DefaultType<IsType<Foo>, Foo>>();
    assert(d.parse(undefined)).equals(f).type<Foo>();
    assert(d.parse(f)).equals(f).type<Foo>();
    assert(d.parse(f1)).equals(f1).type<Foo>();
    assert(d).invalid_type(["1", null, 1]);
  });
});
