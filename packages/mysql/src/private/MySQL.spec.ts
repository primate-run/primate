import MySQL from "#MySQL";
import core_test from "@primate/core/db/test";
import test from "@rcompat/test";
import p from "pema";

const config = {
  database: "primate",
  username: "primate",
  password: "primate",
};

core_test(new MySQL(config));

const db = new MySQL(config);
const json_as = {
  table: "json_test",
  pk: "id",
  types: { id: "string", data: "json" } as const,
};

const json_as_raw = {
  table: "json_test",
  pk: "id",
  types: { id: "string", data: "string" } as const,
};

test.ended(() => db.close());

async function $(body: () => Promise<void>) {
  await db.schema.create("json_test", { name: "id", generate: false }, {
    id: p.string.datatype,
    data: p.json().datatype,
  });
  try {
    await body();
  } finally {
    await db.schema.delete("json_test");
  }
}

test.case("json column rejects invalid json", async assert => {
  await $(async () => {
    try {
      // bypass pema, send raw invalid JSON string directly
      await db.create(json_as_raw, { id: "1", data: "not valid json{{{" });
      assert(false).true(); // should not reach here
    } catch (e) {
      assert((e as any).code).equals("ER_INVALID_JSON_TEXT");
    }
  });
});
