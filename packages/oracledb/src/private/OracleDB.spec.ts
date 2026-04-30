import OracleDB from "#OracleDB";
import baseTest from "@primate/core/db/test";
import testSQL from "@primate/core/db/testSQL";

const config = {
  database: "FREEPDB1",
  username: "primate",
  password: "primate",
};

baseTest(new OracleDB(config));

const db = new OracleDB(config, { debug: true });

testSQL(db, setup => {
  const { test, $ } = setup;

  test.case("ddl with no input or output", async assert => {
    await $(async () => {
      const createIndex = db.sql({
        query: "CREATE INDEX idx_users_name ON users (name)",
      });

      await createIndex();
      assert(true).equals(true);
    });
  });
});
