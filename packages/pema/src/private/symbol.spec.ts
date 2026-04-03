import type DefaultType from "#DefaultType";
import type OptionalType from "#OptionalType";
import symbol from "#symbol";
import type SymbolType from "#SymbolType";
import test from "#test";

const s = Symbol();
const foo_s = Symbol("foo");
const bar_s = Symbol("bar");

test.case("fail", assert => {
  assert(symbol).invalid_type([1, null, undefined, true, "foo", {}]);
});

test.case("pass", assert => {
  assert(symbol).type<SymbolType>();
  assert(symbol.parse(s)).equals(s).type<symbol>();
});

test.case("default", assert => {
  [symbol.default(foo_s), symbol.default(() => foo_s)].forEach(d => {
    assert(d).type<DefaultType<SymbolType, typeof foo_s>>();
    assert(d.parse(undefined)).equals(foo_s).type<symbol>();
    assert(d.parse(foo_s)).equals(foo_s).type<symbol>();
    assert(d.parse(bar_s)).equals(bar_s).type<symbol>();
    assert(d).invalid_type([1, null, "foo"]);
  });
});

test.case("optional", assert => {
  const o = symbol.optional();
  assert(o).type<OptionalType<SymbolType>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse(s)).equals(s).type<symbol>();
  assert(o).invalid_type([1, null, "foo"]);
});

test.case("toJSON", assert => {
  assert(symbol.toJSON())
    .type<{ type: "symbol" }>()
    .equals({ type: "symbol" });
});
