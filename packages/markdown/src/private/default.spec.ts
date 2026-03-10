import test from "@primate/test";

const browser = test.setup(import.meta.dirname);

test.ended(() => browser.close());

test.case("renders heading", async assert => {
  await using tab = await browser.open();
  await tab.goto("/");
  assert(tab.select("h1")?.textContent).equals("Hello");
});

test.case("toc", async assert => {
  await using tab = await browser.open();
  const doc = await tab.fetch("/data");
  assert(doc.toc).equals([
    { depth: 1, slug: "hello", text: "Hello" },
    { depth: 2, slug: "section-one", text: "Section one" },
    { depth: 2, slug: "section-two", text: "Section two" },
  ]);
});

test.case("meta", async assert => {
  await using tab = await browser.open();
  const doc = await tab.fetch("/data");
  assert(doc.meta).equals({ title: "Hi" });
});

test.case("md", async assert => {
  await using tab = await browser.open();
  const doc = await tab.fetch("/data");
  assert(doc.md).equals("# Hello\n\n## Section one\n\n## Section two\n");
});

test.case("html", async assert => {
  await using tab = await browser.open();
  const doc = await tab.fetch("/data");
  assert(doc.html).equals(`<h1>Hello</h1>
<h2>Section one</h2>
<h2>Section two</h2>
`);
});
