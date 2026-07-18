import test from "@primate/test";
import http from "@rcompat/http";

const browser = test.setup(import.meta.dirname);

test.case("backend redirect responses", async assert => {
  await using tab = await browser.open();

  const redirected = await tab.fetch("/response/redirect", {
    redirect: "manual",
  });
  assert(redirected.status).equals(http.Status.FOUND);
  assert(redirected.headers.get("Location")).equals("/redirected");

  const permanent = await tab.fetch("/response/redirect-status", {
    redirect: "manual",
  });
  assert(permanent.status).equals(http.Status.MOVED_PERMANENTLY);
  assert(permanent.headers.get("Location")).equals("/redirected");
});

test.ended(async () => {
  await browser.close();
});
