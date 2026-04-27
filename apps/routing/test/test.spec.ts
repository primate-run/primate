import test from "@primate/test";
import http from "@rcompat/http";

const browser = test.setup(import.meta.dirname);

test.ended(async () => {
  await browser.close();
});

test.case("index", async assert => {
  await using tab = await browser.open();
  for (const url of ["/", "//", "/index", "//index"]) {
    assert(await tab.text(url)).equals("index");
  }
});

test.case("static", async assert => {
  await using tab = await browser.open();
  for (const url of [
    "/static",
    "//static",
    "/static/",
    "//static",
    "/static//",
    "//static//",
    "/static/index",
    "/static/index/",
    "/static//index/",
    "//static//index//",
  ]) {
    assert(await tab.text(url)).equals("static");
  }
  const response = await tab.fetch("//static//index/foo");
  assert(response.status).equals(http.Status.NOT_FOUND);
});

test.case("dynamic", async assert => {
  await using tab = await browser.open();
  const valid = {
    "/1": "1",
    "/1 1": "1 1",
    "/1%201": "1 1",
    "/foo": "foo",
    "/a%2Fb": "a/b",
  };
  const invalid = ["/a/b", "/foo/bar"];

  for (const [path, expected] of Object.entries(valid)) {
    assert(await tab.text(`/dynamic${path}`)).equals(expected);
  }
  for (const path of invalid) {
    assert(await tab.status(`/dynamic${path}`)).equals(http.Status.NOT_FOUND);
  }
});

test.case("optional", async assert => {
  await using tab = await browser.open();
  const valid = {
    "": "index",
    "/": "index",
    "/1": "1",
    "/foo": "foo",
    "/foo%2Fbar": "foo/bar",
  };
  const invalid = ["/foo/bar"];

  for (const [path, expected] of Object.entries(valid)) {
    assert(await tab.text(`/optional${path}`)).equals(expected);
  }
  for (const path of invalid) {
    assert(await tab.status(`/optional${path}`)).equals(http.Status.NOT_FOUND);
  }
});

test.case("rest", async assert => {
  await using tab = await browser.open();
  const valid = {
    "/1": "1",
    "/foo": "foo",
    "/foo/bar": "foo/bar",
    "/foo%2Fbar": "foo/bar",
    "/foo%2F/bar": "foo//bar",
  };

  for (const [path, expected] of Object.entries(valid)) {
    assert(await tab.text(`/rest${path}`)).equals(expected);
  }
});

test.case("optional-rest", async assert => {
  await using tab = await browser.open();
  const valid = {
    "": "index",
    "/1": "1",
    "/foo": "foo",
    "/foo/bar": "foo/bar",
  };

  for (const [path, expected] of Object.entries(valid)) {
    assert(await tab.text(`/optional-rest${path}`)).equals(expected);
  }
});

test.case("hook", async assert => {
  await using tab = await browser.open();

  assert(await tab.text("/hook")).equals("wrong");
  assert(await tab.text("/hook?password=opensesame")).equals("right");
});

test.case("hook order", async assert => {
  await using tab = await browser.open();

  assert(await tab.text("/hook-order/outer/inner")).equals("outerinner");
});
