import test from "@primate/test";

const browser = test.setup(import.meta.dirname);

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

test.ended(async () => {
  await browser.close();
});
