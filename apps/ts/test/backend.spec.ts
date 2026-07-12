import test from "@primate/test";
import http from "@rcompat/http";

const browser = test.backend(import.meta.dirname);

test.backend.async(browser);

test.case("/no-head", async assert => {
  await using tab = await browser.open();
  const get = await tab.fetch("/no-head");
  const head = await tab.fetch("/no-head", { method: "HEAD" });
  assert(head.status).equals(200);
  assert(head.headers.get("content-length")).equals(
    get.headers.get("content-length"),
  );
});

test.case("/has-head uses bespoke handler", async assert => {
  await using tab = await browser.open();
  const res = await tab.fetch("/has-head", { method: "HEAD" });
  assert(res.status).equals(200);
  assert(res.headers.get("x-custom")).equals("bespoke");
});

test.case("/post-only returns 404 on HEAD", async assert => {
  await using tab = await browser.open();
  const res = await tab.fetch("/post-only", { method: "HEAD" });
  assert(res.status).equals(404);
});

test.case("i18n with", async assert => {
  await using tab = await browser.open();
  // active locale on the server is en-US, but with("de") should override it
  assert(await tab.text("/i18n/with"))
    .equals("Hallo John, möchten Sie 5 Äpfel?");
});

test.case("i18n with-unknown-locale", async assert => {
  await using tab = await browser.open();
  const response = await tab.fetch("/i18n/with-unknown-locale");
  assert(response.status).equals(http.Status.NOT_FOUND);
});

test.ended(async () => {
  await browser.close();
});
