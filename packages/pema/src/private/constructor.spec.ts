import constructor from "#constructor";
import type ConstructorType from "#ConstructorType";
import type DefaultType from "#DefaultType";
import type OptionalType from "#OptionalType";
import test from "#test";

class Foo { }
class Bar { }

const foo = constructor(Foo);
const f = new Foo();
const f1 = new Foo();
const b = new Bar();

test.case("fail", assert => {
  assert(foo).invalid_type(["1", 1, null, undefined, true, {}, [], b]);
});

test.case("pass", assert => {
  assert(foo).type<ConstructorType<typeof Foo>>();
  assert(foo.parse(f)).equals(f).type<Foo>();
  assert(foo.parse(f1)).equals(f1).type<Foo>();
});

test.case("subclass", assert => {
  class SubFoo extends Foo { }
  const sf = new SubFoo();
  assert(foo.parse(sf)).equals(sf).type<Foo>();
});

test.case("optional", assert => {
  const o = foo.optional();
  assert(o).type<OptionalType<ConstructorType<typeof Foo>>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse(f)).equals(f).type<Foo>();
  assert(o).invalid_type([b, "1"]);
});

test.case("default", assert => {
  [foo.default(f), foo.default(() => f)].forEach(d => {
    assert(d).type<DefaultType<ConstructorType<typeof Foo>, Foo>>();
    assert(d.parse(undefined)).equals(f).type<Foo>();
    assert(d.parse(f)).equals(f).type<Foo>();
    assert(d.parse(f1)).equals(f1).type<Foo>();
    assert(d).invalid_type([1, b, "foo"]);
  });
});

test.case("toJSON", assert => {
  assert(foo.toJSON())
    .type<{ type: "newable"; of: string }>()
    .equals({ type: "newable", of: "Foo" });
});
