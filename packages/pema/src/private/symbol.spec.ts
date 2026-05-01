import type DefaultType from "#DefaultType";
import p from "#index";
import type OptionalType from "#OptionalType";
import type SymbolType from "#SymbolType";
import test from "#test";

const s = Symbol();
const foo_s = Symbol("foo");
const bar_s = Symbol("bar");

test.case("fail", assert => {
  assert(p.symbol).invalid_type([1, null, undefined, true, "foo", {}]);
});

test.case("pass", assert => {
  assert(p.symbol).type<SymbolType>();
  assert(p.symbol.parse(s)).equals(s).type<symbol>();
});

test.case("default", assert => {
  [p.symbol.default(foo_s), p.symbol.default(() => foo_s)].forEach(d => {
    assert(d).type<DefaultType<SymbolType, typeof foo_s>>();
    assert(d.parse(undefined)).equals(foo_s).type<symbol>();
    assert(d.parse(foo_s)).equals(foo_s).type<symbol>();
    assert(d.parse(bar_s)).equals(bar_s).type<symbol>();
    assert(d).invalid_type([1, null, "foo"]);
  });
});

test.case("optional", assert => {
  const o = p.symbol.optional();
  assert(o).type<OptionalType<SymbolType>>();
  assert(o.parse(undefined)).equals(undefined);
  assert(o.parse(s)).equals(s).type<symbol>();
  assert(o).invalid_type([1, null, "foo"]);
});

test.case("toJSON", assert => {
  assert(p.symbol.toJSON())
    .type<{ type: "symbol" }>()
    .equals({ type: "symbol" });
});
