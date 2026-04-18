import test from "@primate/test";
import type { Dict } from "@rcompat/type";

const browser = test.setup(import.meta.dirname);

test.ended(async () => {
  await browser.close();
});

const cases: Dict<{
  type: "json" | "text";
  expected: unknown;
}> = {
  count: { type: "json", expected: { count: 2 } },
  delete: { type: "text", expected: "deleted" },
  find: { type: "json", expected: [{ name: "Donald", age: 30 }] },
  get: { type: "json", expected: { name: "Donald", age: 30 } },
  try: { type: "json", expected: { name: "Donald", age: 30 } },
  has: { type: "json", expected: { has: true } },
  index: { type: "json", expected: { count: 0 } },
  insert: { type: "json", expected: { name: "Donald", age: 30 } },
  update: { type: "json", expected: { name: "Donald", age: 35 } },
  programmatic: { type: "text", expected: "User" },
};

for (const [name, { type, expected }] of Object.entries(cases)) {
  test.case(name, async assert => {
    await using tab = await browser.open();
    const response = await tab[type](`/${name}`);
    assert(response).equals(expected);
  });
}
