import type DefaultType from "#DefaultType";
import test from "#test";
import url from "#url";
import type URLType from "#URLType";

const address = "https://primate.run";

test.case("fail", assert => {
  assert(url).invalid_type([address]);
});

test.case("pass", assert => {
  assert(url).type<URLType>();

  const u = new URL(address);
  assert(url.parse(u)).equals(u).type<URL>();
});

test.case("default", assert => {
  const u = new URL(address);
  const u1 = new URL("https://example.org");

  [url.default(u), url.default(() => u)].forEach(d => {
    assert(d).type<DefaultType<URLType, URL>>();
    assert(d.parse(undefined)).equals(u).type<URL>();
    assert(d.parse(u)).equals(u).type<URL>();
    assert(d.parse(u1)).equals(u1).type<URL>();
    assert(url).invalid_type([1]);
  });
});

test.case("toJSON", assert => {
  assert(url.toJSON())
    .type<{ type: "url"; datatype: "url" }>()
    .equals({ type: "url", datatype: "url" })
    ;
});
