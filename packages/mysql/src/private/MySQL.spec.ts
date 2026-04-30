import MySQL from "#MySQL";
import baseTest from "@primate/core/db/test";
import testSQL from "@primate/core/db/testSQL";

const config = {
  database: "primate",
  username: "primate",
  password: "primate",
};

baseTest(new MySQL(config));

const db = new MySQL(config);

const json_as_raw = {
  table: "json",
  pk: "id",
  types: { id: "string", data: "string" } as const,
};

testSQL(db, setup => {
  const { test, $ } = setup;

  test.case("json column rejects invalid json", async assert => {
    await $(async () => {
      try {
        await db.create(json_as_raw, { id: "1", data: "not valid json{{{" });
        assert(false).true();
      } catch {
        assert(true).true();
      }
    });
  });

  test.case("ddl with no input or output", async assert => {
    await $(async () => {
      const createIndex = db.sql({
        query: "CREATE INDEX idx_users_name ON users (name(50))",
      });

      await createIndex();
      assert(true).equals(true);
    });
  });
});
