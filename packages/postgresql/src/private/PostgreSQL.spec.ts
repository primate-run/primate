import PostgreSQL from "#PostgreSQL";
import core_test from "@primate/core/db/test";
import test from "@rcompat/test";
import p from "pema";

type Work = () => Promise<unknown>;

core_test(new PostgreSQL({ database: "primate", username: "primate" }));

const db = new PostgreSQL(
  { database: "primate", username: "primate" },
  { debug: true },
);

const users_types = { id: "u32", name: "string", age: "u8" } as const;
const users_as = { table: "users", pk: "id", types: users_types };

const posts_types = { id: "u32", user_id: "u32", title: "string" } as const;
const posts_as = { table: "posts", pk: "id", types: posts_types };

const tx_types = { id: "u64", amount: "u128", memo: "string" } as const;
const tx_as = { table: "transactions", pk: "id", types: tx_types };

test.ended(() => db.close());

async function $(body: () => Promise<void>) {
  await db.schema.create({ table: "users", types: {}, pk: "id" }, {
    id: p.u32, name: p.string, age: p.u8,
  });
  await db.schema.create({ table: "posts", types: {}, pk: "id" }, {
    id: p.u32, user_id: p.u32, title: p.string,
  });
  await db.schema.create({ table: "transactions", types: {}, pk: "id" }, {
    id: p.u64, amount: p.u128, memo: p.string,
  });

  try {
    await body();
  } finally {
    await db.schema.delete("users");
    await db.schema.delete("posts");
    await db.schema.delete("transactions");
  }
}

function normalize(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

function query_equals(name: string, work: Work, expected: string) {
  test.case(name, async assert => {
    await $(async () => {
      await work();
      assert(normalize(db.explain.users.query)).equals(normalize(expected));
    });
  });
}

query_equals("select all",
  () => db.read(users_as, { where: {} }),
  "SELECT * FROM \"users\"",
);

query_equals("select with fields",
  () => db.read(users_as, { where: {}, fields: ["name", "age"] }),
  "SELECT \"name\", \"age\" FROM \"users\"",
);

query_equals("where equality",
  () => db.read(users_as, { where: { name: "bob" } }),
  "SELECT * FROM \"users\" WHERE \"name\" = $1",
);

query_equals("where multiple fields",
  () => db.read(users_as, { where: { name: "bob", age: 25 } }),
  "SELECT * FROM \"users\" WHERE \"name\" = $1 AND \"age\" = $2",
);

query_equals("where null",
  () => db.read(users_as, { where: { name: null } }),
  "SELECT * FROM \"users\" WHERE \"name\" IS NULL",
);

query_equals("where $ne",
  () => db.read(users_as, { where: { age: { $ne: 30 } } }),
  "SELECT * FROM \"users\" WHERE \"age\" != $1",
);

query_equals("where $gt",
  () => db.read(users_as, { where: { age: { $gt: 18 } } }),
  "SELECT * FROM \"users\" WHERE \"age\" > $1",
);

query_equals("where $gte + $lt",
  () => db.read(users_as, { where: { age: { $gte: 18, $lt: 65 } } }),
  "SELECT * FROM \"users\" WHERE \"age\" >= $1 AND \"age\" < $2",
);

query_equals("sort asc",
  () => db.read(users_as, { where: {}, sort: { name: "asc" } }),
  "SELECT * FROM \"users\" ORDER BY \"name\" ASC",
);

query_equals("sort desc",
  () => db.read(users_as, { where: {}, sort: { age: "desc" } }),
  "SELECT * FROM \"users\" ORDER BY \"age\" DESC",
);

query_equals("limit",
  () => db.read(users_as, { where: {}, limit: 10 }),
  "SELECT * FROM \"users\" LIMIT 10",
);

query_equals("where + sort + limit",
  () => db.read(users_as, {
    where: { age: { $gt: 21 } },
    sort: { name: "asc" },
    limit: 5,
  }),
  "SELECT * FROM \"users\" WHERE \"age\" > $1 ORDER BY \"name\" ASC LIMIT 5",
);

test.case("$like uses LIKE", async assert => {
  await $(async () => {
    await db.read(users_as, { where: { name: { $like: "bob%" } } });
    const q = db.explain.users.query;
    assert(q.includes(" LIKE ")).true();
    assert(q.includes(" ILIKE ")).false();
  });
});

test.case("$ilike uses ILIKE", async assert => {
  await $(async () => {
    await db.read(users_as, { where: { name: { $ilike: "bob%" } } });
    const q = db.explain.users.query;
    assert(q.includes(" ILIKE ")).true();
  });
});

// BIGINT handling, we cast to numeric on compare/order
test.case("u128 $gt uses ::numeric cast", async assert => {
  await $(async () => {
    await db.read(tx_as, { where: { amount: { $gt: 1000n } } });
    assert(db.explain.transactions.query.includes("::numeric")).true();
  });
});

test.case("u64 pk $gte uses ::numeric cast", async assert => {
  await $(async () => {
    await db.read(tx_as, { where: { id: { $gte: 100n } } });
    assert(db.explain.transactions.query.includes("::numeric")).true();
  });
});

// QUERY PLAN
test.case("plan: name equality uses Seq Scan (no index)", async assert => {
  await $(async () => {
    await db.read(users_as, { where: { name: "bob" } });
    assert(db.explain.users.plans.some(plan => /Seq Scan/i.test(plan))).true();
  });
});

test.case("plan: pk lookup likely uses an index scan", async assert => {
  await $(async () => {
    await db.read(users_as, { where: { id: 1 } });
    const plans = db.explain.users.plans.join("\n");
    assert(/Index (Only )?Scan|Bitmap Index Scan/i.test(plans)).true();
  });
});

test.case("join: simple many-relation", async assert => {
  await $(async () => {
    await db.create(users_as, { id: 1, name: "bob", age: 30 });
    await db.create(posts_as, { id: 1, user_id: 1, title: "post" });

    await db.read(users_as, {
      where: { id: 1 },
      with: {
        posts: {
          as: posts_as,
          kind: "many",
          fk: "user_id",
          reverse: false,
          where: {},
        },
      },
    });

    assert(db.explain.users.query.includes("LEFT JOIN")).true();
    assert(db.explain.posts).equals(undefined); // no second query
  });
});

test.case("join: field projection", async assert => {
  await $(async () => {
    await db.create(users_as, { id: 1, name: "bob", age: 30 });
    await db.create(posts_as, { id: 1, user_id: 1, title: "post" });

    await db.read(users_as, {
      where: { id: 1 },
      with: {
        posts: {
          as: posts_as,
          kind: "many",
          fk: "user_id",
          reverse: false,
          where: {},
          fields: ["title"],
        },
      },
    });

    const q = db.explain.users.query;
    assert(q.includes("LEFT JOIN")).true();
    assert(q.includes("\"title\"")).true();
    assert(q.includes("\"user_id\"")).true();
  });
});

test.case("phased: where triggers IN clause", async assert => {
  await $(async () => {
    await db.create(users_as, { id: 1, name: "bob", age: 30 });
    await db.create(posts_as, { id: 1, user_id: 1, title: "hello" });

    await db.read(users_as, {
      where: { id: 1 },
      with: {
        posts: {
          as: posts_as,
          kind: "many",
          fk: "user_id",
          reverse: false,
          where: { title: "hello" },
        },
      },
    });

    const q = db.explain.posts.query;
    assert(q.includes("IN (")).true();
    assert(q.includes("\"title\" = $1")).true();
  });
});

test.case("phased: sort triggers IN clause", async assert => {
  await $(async () => {
    await db.create(users_as, { id: 1, name: "bob", age: 30 });
    await db.create(posts_as, { id: 1, user_id: 1, title: "post" });

    await db.read(users_as, {
      where: { id: 1 },
      with: {
        posts: {
          as: posts_as,
          kind: "many",
          fk: "user_id",
          reverse: false,
          where: {},
          sort: { title: "desc" },
        },
      },
    });

    const q = db.explain.posts.query;
    assert(q.includes("IN (")).true();
    assert(q.includes("\"title\" DESC")).true();
  });
});

test.case("phased: limit triggers window function", async assert => {
  await $(async () => {
    await db.create(users_as, { id: 1, name: "bob", age: 30 });
    await db.create(posts_as, { id: 1, user_id: 1, title: "p1" });
    await db.create(posts_as, { id: 2, user_id: 1, title: "p2" });

    await db.read(users_as, {
      where: { id: 1 },
      with: {
        posts: {
          as: posts_as,
          kind: "many",
          fk: "user_id",
          reverse: false,
          where: {},
          limit: 1,
        },
      },
    });

    const q = db.explain.posts.query;
    assert(q.includes("ROW_NUMBER()")).true();
    assert(q.includes("PARTITION BY")).true();
  });
});

test.case("phased: kind=one triggers window function", async assert => {
  await $(async () => {
    await db.create(users_as, { id: 1, name: "bob", age: 30 });
    await db.create(posts_as, { id: 1, user_id: 1, title: "p1" });
    await db.create(posts_as, { id: 2, user_id: 1, title: "p2" });

    await db.read(users_as, {
      where: { id: 1 },
      with: {
        posts: {
          as: posts_as,
          kind: "one",
          fk: "user_id",
          reverse: false,
          where: {},
        },
      },
    });

    assert(db.explain.posts.query.includes("ROW_NUMBER()")).true();
  });
});

// window function
test.case("window: ORDER BY uses relation sort", async assert => {
  await $(async () => {
    await db.create(users_as, { id: 1, name: "bob", age: 30 });
    await db.create(posts_as, { id: 1, user_id: 1, title: "z-last" });
    await db.create(posts_as, { id: 2, user_id: 1, title: "a-first" });

    await db.read(users_as, {
      where: { id: 1 },
      with: {
        posts: {
          as: posts_as,
          kind: "many",
          fk: "user_id",
          reverse: false,
          where: {},
          sort: { title: "asc" },
          limit: 1,
        },
      },
    });

    const q = normalize(db.explain.posts.query);
    const pattern = /ROW_NUMBER\(\)\s+OVER\s*\(\s*PARTITION\s+BY\s+"user_id"\s+ORDER\s+BY\s+"title"\s+ASC/i;
    assert(pattern.test(q)).true();
  });
});

test.case("window: limit + sort returns correct row", async assert => {
  await $(async () => {
    await db.create(users_as, { id: 1, name: "bob", age: 30 });
    await db.create(posts_as, { id: 1, user_id: 1, title: "z-last" });
    await db.create(posts_as, { id: 2, user_id: 1, title: "a-first" });

    const rows = await db.read(users_as, {
      where: { id: 1 },
      with: {
        posts: {
          as: posts_as,
          kind: "many",
          fk: "user_id",
          reverse: false,
          where: {},
          sort: { title: "asc" },
          limit: 1,
        },
      },
    }) as { posts: { title: string }[] }[];

    assert(rows[0].posts.length).equals(1);
    assert(rows[0].posts[0].title).equals("a-first");
  });
});
