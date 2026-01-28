import SQLite from "#SQLite";
import core_test from "@primate/core/db/test";
import test from "@rcompat/test";
import p from "pema";

type Work = () => Promise<unknown>;

core_test(new SQLite());

const db = new SQLite({ database: ":memory:" }, { debug: true });

const users_types = { id: "u32", name: "string", age: "u8" } as const;
const users_as = { name: "users", pk: "id", types: users_types };

const posts_types = { id: "u32", user_id: "u32", title: "string" } as const;
const posts_as = { name: "posts", pk: "id", types: posts_types };

const tx_types = { id: "u64", amount: "u128", memo: "string" } as const;
const tx_as = { name: "transactions", pk: "id", types: tx_types };

test.ended(() => db.close());

async function $(body: () => Promise<void>) {
  db.schema.create("users", {
    id: p.u32, name: p.string, age: p.u8,
  }, "id");
  db.schema.create("posts", {
    id: p.u32, user_id: p.u32, title: p.string,
  }, "id");
  db.schema.create("transactions", {
    id: p.u64, amount: p.u128, memo: p.string,
  }, "id");
  await body();
  db.schema.delete("users");
  db.schema.delete("posts");
  db.schema.delete("transactions");
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
  "SELECT * FROM `users`",
);

query_equals("select with fields",
  () => db.read(users_as, { where: {}, fields: ["name", "age"] }),
  "SELECT `name`, `age` FROM `users`",
);

query_equals("where equality",
  () => db.read(users_as, { where: { name: "bob" } }),
  "SELECT * FROM `users` WHERE `name` = $name",
);

query_equals("where multiple fields",
  () => db.read(users_as, { where: { name: "bob", age: 25 } }),
  "SELECT * FROM `users` WHERE `name` = $name AND `age` = $age",
);

query_equals("where null",
  () => db.read(users_as, { where: { name: null } }),
  "SELECT * FROM `users` WHERE `name` IS NULL",
);

query_equals("where $ne",
  () => db.read(users_as, { where: { age: { $ne: 30 } } }),
  "SELECT * FROM `users` WHERE `age` != $age__ne",
);

query_equals("where $gt",
  () => db.read(users_as, { where: { age: { $gt: 18 } } }),
  "SELECT * FROM `users` WHERE `age` > $age__gt",
);

query_equals("where $gte + $lt",
  () => db.read(users_as, { where: { age: { $gte: 18, $lt: 65 } } }),
  "SELECT * FROM `users` WHERE `age` >= $age__gte AND `age` < $age__lt",
);

query_equals("sort asc",
  () => db.read(users_as, { where: {}, sort: { name: "asc" } }),
  "SELECT * FROM `users` ORDER BY `name` ASC",
);

query_equals("sort desc",
  () => db.read(users_as, { where: {}, sort: { age: "desc" } }),
  "SELECT * FROM `users` ORDER BY `age` DESC",
);

query_equals("limit",
  () => db.read(users_as, { where: {}, limit: 10 }),
  "SELECT * FROM `users` LIMIT 10",
);

query_equals("where + sort + limit",
  () => db.read(users_as, {
    where: { age: { $gt: 21 } },
    sort: { name: "asc" },
    limit: 5,
  }),
  "SELECT * FROM `users` WHERE `age` > $age__gt ORDER BY `name` ASC LIMIT 5",
);

// LIKE -> GLOB
// SQLite uses GLOB for case-sensitive, LIKE for case-insensitive patterns

test.case("$like uses GLOB", async assert => {
  await $(async () => {
    await db.read(users_as, { where: { name: { $like: "bob%" } } });
    assert(db.explain.users.query).includes("GLOB");
  });
});

test.case("$ilike uses LOWER + LIKE", async assert => {
  await $(async () => {
    await db.read(users_as, { where: { name: { $ilike: "bob%" } } });
    assert(db.explain.users.query).includes("LOWER");
    assert(db.explain.users.query).includes("LIKE");
  });
});

// BIGINT AS TEXT
// We stores u64/u128/i128 as TEXT, lexicographic comparison fails: "9" > "10"
// Compare LENGTH first: longer string = larger number

test.case("u128 $gt uses LENGTH comparison", async assert => {
  await $(async () => {
    await db.read(tx_as, { where: { amount: { $gt: 1000n } } });
    assert(db.explain.transactions.query).includes("LENGTH(");
  });
});

test.case("u64 pk $gte uses LENGTH comparison", async assert => {
  await $(async () => {
    await db.read(tx_as, { where: { id: { $gte: 100n } } });
    assert(db.explain.transactions.query).includes("LENGTH(");
  });
});

// QUERY PLAN

test.case("plan: table scan without index", async assert => {
  await $(async () => {
    await db.read(users_as, { where: { name: "bob" } });
    assert(db.explain.users.plans.some(plan => plan.includes("SCAN"))).true();
  });
});

test.case("plan: pk lookup uses index", async assert => {
  await $(async () => {
    await db.read(users_as, { where: { id: 1 } });
    const plans = db.explain.users.plans;
    assert(plans.some(plan => plan.includes("SEARCH"))).true();
    assert(plans.some(plan => plan.includes("PRIMARY"))).true();
  });
});

// RELATION STRATEGY
//
// two strategies for loading relations:
//
// JOIN (single query):
//   SELECT ... FROM parent LEFT JOIN child ON ...
//   Used when: single many-relation, no limit, no sort, no where
//
// PHASED (two queries):
//   1. SELECT ... FROM parent
//   2. SELECT ... FROM child WHERE fk IN (...) + optional window function
//   Used when: limit, sort, where, or kind=one

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

    assert(db.explain.users.query).includes("LEFT JOIN");
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
    assert(q).includes("LEFT JOIN");
    assert(q).includes("`title`");
    assert(q).includes("`user_id`");
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

    assert(db.explain.posts.query).includes("IN (");
    assert(db.explain.posts.query).includes("`title` = $title");
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

    assert(db.explain.posts.query).includes("IN (");
    assert(db.explain.posts.query).includes("`title` DESC");
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
    assert(q).includes("ROW_NUMBER()");
    assert(q).includes("PARTITION BY");
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

    assert(db.explain.posts.query).includes("ROW_NUMBER()");
  });
});

// WINDOW FUNCTION CORRECTNESS
//
// ROW_NUMBER() OVER (PARTITION BY fk ORDER BY ...) must use relation sort,
// not the partition key, to rank children correctly
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
    const pattern = /ROW_NUMBER\(\)\s+OVER\s*\(\s*PARTITION\s+BY\s+`user_id`\s+ORDER\s+BY\s+`title`\s+ASC/i;
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
