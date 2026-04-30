import type SQLDB from "#db/SQLDB";
import { Code } from "#db/errors";
import test from "@rcompat/test";
import p from "pema";

const dt = {
  u8: p.u8.datatype,
  u32: p.u32.datatype,
  u64: p.u64.datatype,
  u128: p.u128.datatype,
  string: p.string.datatype,
};

const users = {
  table: "users",
  pk: "id",
  types: { id: dt.u32, name: dt.string, age: dt.u8 },
};

const posts = {
  table: "posts",
  pk: "id",
  types: {
    id: dt.u32, user_id: dt.u32, title: dt.string,
  },
};

const transactions = {
  table: "transactions",
  pk: "id",
  types: {
    id: dt.u64, amount: dt.u128, memo: dt.string,
  },
};

const json = {
  table: "json",
  pk: "id",
  types: { id: dt.string, data: "json" } as const,
};

const pk_config = { name: "id", generate: true };

type Setup = {
  $: (body: () => Promise<void>) => Promise<void>;
  users: typeof users;
  posts: typeof posts;
  transactions: typeof transactions;
  json: typeof json;
  test: typeof test;
  query_equals: (name: string, work: Work, expected: string) => void;
};

type Work = () => Promise<unknown>;

function normalize(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

export default function testSQL(db: SQLDB, cb: (setup: Setup) => void) {
  async function $(body: () => Promise<void>) {
    await db.schema.create("users", pk_config, users.types);
    await db.schema.create("posts", pk_config, posts.types);
    await db.schema.create("transactions", pk_config, transactions.types);
    await db.schema.create("json", pk_config, json.types);
    await body();
    await db.schema.delete("users");
    await db.schema.delete("posts");
    await db.schema.delete("transactions");
    await db.schema.delete("json");
  }

  function query_equals(name: string, work: Work, expected: string) {
    test.case(name, async assert => {
      await $(async () => {
        await work();
        assert(normalize((db as any).explain.users.query)).equals(normalize(expected));
      });
    });
  }

  cb({
    $,
    users,
    posts,
    transactions,
    json,
    test,
    query_equals,
  });

  test.ended(() => db.close());

  test.group("sql", () => {
    test.case("select with input and output", async assert => {
      await $(async () => {
        await db.create(users, { id: 1, name: "alice", age: 30 });
        await db.create(users, { id: 2, name: "bob", age: 25 });

        const findByAge = db.sql({
          input: p({ age: p.u8 }),
          query: "SELECT name FROM users WHERE age > :age",
          output: p.array(p({ name: p.string })),
        });

        const results = await findByAge({ age: 24 });
        assert(results.length).equals(2);
        assert(results[0].name).equals("alice");
        assert(results[1].name).equals("bob");
      });
    });

    test.case("select with no input", async assert => {
      await $(async () => {
        await db.create(users, { id: 1, name: "alice", age: 30 });
        await db.create(users, { id: 2, name: "bob", age: 25 });

        const findAll = db.sql({
          query: "SELECT name FROM users",
          output: p.array(p({ name: p.string })),
        });

        const results = await findAll();
        assert(results.length).equals(2);
      });
    });

    test.case("insert with no output", async assert => {
      await $(async () => {
        const insert = db.sql({
          input: p({ name: p.string, age: p.u8 }),
          query: "INSERT INTO users (name, age) VALUES (:name, :age)",
        });

        await insert({ name: "charlie", age: 20 });

        const rows = await db.read(users, { where: { name: "charlie" } });
        assert(rows.length).equals(1);
        assert(rows[0].name).equals("charlie");
      });
    });

    test.case("update with no output", async assert => {
      await $(async () => {
        await db.create(users, { id: 1, name: "alice", age: 30 });

        const updateAge = db.sql({
          input: p({ age: p.u8, name: p.string }),
          query: "UPDATE users SET age = :age WHERE name = :name",
        });

        await updateAge({ age: 31, name: "alice" });

        const rows = await db.read(users, { where: { name: "alice" } });
        assert(rows[0].age).equals(31);
      });
    });

    test.case("delete with no output", async assert => {
      await $(async () => {
        await db.create(users, { id: 1, name: "alice", age: 30 });

        const deleteByName = db.sql({
          input: p({ name: p.string }),
          query: "DELETE FROM users WHERE name = :name",
        });

        await deleteByName({ name: "alice" });

        const rows = await db.read(users, { where: {} });
        assert(rows.length).equals(0);
      });
    });

    test.case("input validation fails", async assert => {
      await $(async () => {
        const findByAge = db.sql({
          input: p({ age: p.u8 }),
          query: "SELECT name FROM users WHERE age > :age",
          output: p.array(p({ name: p.string })),
        });

        try {
          await findByAge({ age: -1 });
          assert(false).true();
        } catch {
          assert(true).true();
        }
      });
    });

    test.case("empty result", async assert => {
      await $(async () => {
        const findByAge = db.sql({
          input: p({ age: p.u8 }),
          query: "SELECT name FROM users WHERE age > :age",
          output: p.array(p({ name: p.string })),
        });

        const results = await findByAge({ age: 100 });
        assert(results.length).equals(0);
      });
    });

    test.case("placeholder in input but not in query", async assert => {
      await $(async () => {
        assert(() => db.sql({
          // @ts-expect-error 'name' in put but missing in query
          input: p({ age: p.u8, name: p.string }),
          query: "SELECT name FROM users WHERE age > :age",
        })).throws(Code.sql_placeholder_missing);
      });
    });

    test.case("placeholder in query but not in input", async assert => {
      await $(async () => {
        assert(() => db.sql({
          // @ts-expect-error 'name' required but missing in input
          input: p({ age: p.u8 }),
          query: "SELECT name FROM users WHERE age > :age AND name = :name",
        })).throws(Code.sql_input_missing);
      });
    });

    test.case("output validation fails", async assert => {
      await $(async () => {
        await db.create(users, { id: 1, name: "alice", age: 30 });

        const findAll = db.sql({
          query: "SELECT name FROM users",
          output: p.array(p({ name: p.u8 })),
        });

        try {
          await findAll();
          assert(false).true();
        } catch {
          assert(true).true();
        }
      });
    });
  });
}

