import type DefaultType from "#DefaultType";
import expect from "#expect";
import url from "#url";
import type URLType from "#URLType";
import test from "@rcompat/test";

const address = "https://primate.run";

test.case("fail", assert => {
  assert(() => url.parse(address)).throws(expect("ur", address));
});

test.case("pass", assert => {
  assert(url).type<"URLType">();

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
    assert(() => d.parse(1)).throws(expect("ur", 1));
  });
});
