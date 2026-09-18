import html_safe_json from "#html-safe-json";
import test from "@rcompat/test";

test.case("escapes script-end sequences for HTML embedding", assert => {
  const json = html_safe_json({ html: "<script></script>" });

  assert(json.includes("</script>")).false();
  assert(json.includes("\\u003c/script\\u003e")).true();
  assert(JSON.parse(json)).equals({ html: "<script></script>" });
});

test.case("escapes other HTML-sensitive JSON substrings", assert => {
  const value = { text: "<&>\u2028\u2029" };
  const json = html_safe_json(value);

  assert(json).equals('{"text":"\\u003c\\u0026\\u003e\\u2028\\u2029"}');
  assert(JSON.parse(json)).equals(value);
});
