import SQLite from "#SQLite";
import core_test from "@primate/core/db/test";
import test from "@rcompat/test";
import p from "pema";

core_test(new SQLite());

const db = new SQLite({ database: ":memory:" }, { debug: true });

function normalize(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

const users_types = { id: "u32", name: "string", age: "u8" } as const;
const users_as = { name: "users", pk: "id", types: users_types };

// Transactions table (for bigint tests)
const tx_types = { id: "u64", amount: "u128", memo: "string" } as const;
const tx_as = { name: "transactions", pk: "id", types: tx_types };

const posts_types = { id: "u32", user_id: "u32", title: "string" } as const;
const posts_as = { name: "posts", pk: "id", types: posts_types };

test.ended(() => {
  db.close();
});

async function $(body: () => Promise<void>) {
  db.schema.create("users", {
    id: p.u32,
    name: p.string,
    age: p.u8,
  }, "id");
  db.schema.create("transactions", {
    id: p.u64,
    amount: p.u128,
    memo: p.string,
  }, "id");
  db.schema.create("posts", {
    id: p.u32,
    user_id: p.u32,
    title: p.string,
  }, "id");
  await body();
  db.schema.delete("users");
  db.schema.delete("transactions");
  db.schema.delete("posts");
};

function produces(name: string, work: () => Promise<unknown>, sql: string) {
  test.case(name, async assert => {
    await $(async () => {
      await work();
      assert(normalize(db.explain.users.query)).equals(normalize(sql));
    });
  });
}

function query_has(name: string, table: string, work: () => Promise<unknown>, used: string[]) {
  test.case(name, async assert => {
    await $(async () => {
      await work();
      used.forEach(u => assert(db.explain[table].query).includes(u));
    });
  });
}

function relation_query_has(
  name: string,
  work: () => Promise<unknown>,
  by: string,
  used: string[],
) {
  test.case(name, async assert => {
    await $(async () => {
      await work();
      const q = db.explain[by].query;
      used.forEach(u => assert(q).includes(u));
    });
  });
}

function plan_has(name: string, work: () => Promise<unknown>, has: string[]) {
  test.case(name, async assert => {
    await $(async () => {
      await work();
      const plans = Object.values(db.explain).flatMap(row => row.plan);
      assert(has.every(h => plans.some(plan => plan.includes(h)))).true();
    });
  });
}

produces("select all matches baseline",
  () => db.read(users_as, { where: {} }),
  "SELECT * FROM `users`",
);

produces("select with fields matches baseline",
  () => db.read(users_as, { where: {}, fields: ["name", "age"] }),
  "SELECT `name`, `age` FROM `users`",
);

produces("where equality matches baseline",
  () => db.read(users_as, { where: { name: "bob" } }),
  "SELECT * FROM `users` WHERE `name`=$name",
);

produces("where multiple fields matches baseline",
  () => db.read(users_as, { where: { name: "bob", age: 25 } }),
  "SELECT * FROM `users` WHERE `name`=$name AND `age`=$age",
);

produces("where null matches baseline",
  () => db.read(users_as, { where: { name: null } }),
  "SELECT * FROM `users` WHERE `name` IS NULL",
);

produces("where $ne matches baseline",
  () => db.read(users_as, { where: { age: { $ne: 30 } } }),
  "SELECT * FROM `users` WHERE `age` != $age__ne",
);

produces("where $gt matches baseline",
  () => db.read(users_as, { where: { age: { $gt: 18 } } }),
  "SELECT * FROM `users` WHERE `age` > $age__gt",
);

produces("where $gte $lt combined matches baseline",
  () => db.read(users_as, { where: { age: { $gte: 18, $lt: 65 } } }),
  "SELECT * FROM `users` WHERE `age` >= $age__gte AND `age` < $age__lt",
);

query_has("where $like uses GLOB",
  "users",
  () => db.read(users_as, { where: { name: { $like: "bob%" } } }),
  ["GLOB"],
);

query_has("where $ilike uses LOWER LIKE",
  "users",
  () => db.read(users_as, { where: { name: { $ilike: "bob%" } } }),
  ["LOWER", "LIKE"],
);

produces("sort single field matches baseline",
  () => db.read(users_as, { where: {}, sort: { name: "asc" } }),
  "SELECT * FROM `users` ORDER BY `name` ASC",
);

produces("sort desc matches baseline",
  () => db.read(users_as, { where: {}, sort: { age: "desc" } }),
  "SELECT * FROM `users` ORDER BY `age` DESC",
);

produces("limit matches baseline",
  () => db.read(users_as, { where: {}, limit: 10 }),
  "SELECT * FROM `users` LIMIT 10",
);

produces("where + sort + limit matches baseline",
  () => db.read(users_as, {
    where: { age: { $gt: 21 } },
    sort: { name: "asc" },
    limit: 5,
  }),
  "SELECT * FROM `users` WHERE `age` > $age__gt ORDER BY `name` ASC LIMIT 5",
);

query_has("u128 $gt uses length-first comparison",
  "transactions",
  () => db.read(tx_as, { where: { amount: { $gt: 1000n } } }),
  ["LENGTH("],
);

query_has("u64 primary key comparison uses length-first",
  "transactions",
  () => db.read(tx_as, { where: { id: { $gte: 100n } } }),
  ["LENGTH("],
);

plan_has("plan indicates table scan without index",
  () => db.read(users_as, { where: { name: "bob" } }),
  ["SCAN"],
);

plan_has("plan uses primary key for pk lookup",
  () => db.read(users_as, { where: { id: 1 } }),
  ["SEARCH", "PRIMARY"],
);

test.case("relation query uses JOIN clause", async assert => {
  await $(async () => {
    await db.create(users_as, { record: { id: 200, name: "test", age: 25 } });
    await db.create(posts_as, { record: { id: 200, user_id: 200, title: "post" } });

    await db.read(users_as, {
      where: { id: 200 },
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
  });
});

relation_query_has("relation with limit uses window function",
  async () => {
    await db.create(users_as, { record: { id: 200, name: "test", age: 25 } });
    await db.create(posts_as, { record: { id: 2000, user_id: 200, title: "p1" } });
    await db.create(posts_as, { record: { id: 2001, user_id: 200, title: "p2" } });
    await db.read(users_as, {
      where: { id: 200 },
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
  },
  "posts",
  ["ROW_NUMBER()", "PARTITION BY"],
);

test.case("relation limit window orders by relation sort keys (not partition key)", async assert => {
  await $(async () => {
    await db.create(users_as, { record: { id: 200, name: "test", age: 25 } });
    await db.create(posts_as, { record: { id: 2000, user_id: 200, title: "z-last" } });
    await db.create(posts_as, { record: { id: 2001, user_id: 200, title: "a-first" } });

    await db.read(users_as, {
      where: { id: 200 },
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

    // must but be ORDER BY `user_id` inside the window
    // because constant per partition
    assert(q.includes("ROW_NUMBER() OVER")).true();

    // window ORDER BY should reflect relation sort keys
    assert(/ROW_NUMBER\(\)\s+OVER\s*\(\s*PARTITION\s+BY\s+`user_id`\s+ORDER\s+BY\s+`title`\s+ASC/i.test(q)).true();
  });
});

test.case("relation limit is per-parent and respects relation sort (runtime)", async assert => {
  await $(async () => {
    await db.create(users_as, { record: { id: 300, name: "u300", age: 1 } });

    // insert in an order that conflicts with title ASC
    // if window ORDER BY is wrong (e.g. ORDER BY user_id),
    // rn=1 will likely pick the first inserted row
    await db.create(posts_as, { record: { id: 3000, user_id: 300, title: "z-last" } });
    await db.create(posts_as, { record: { id: 3001, user_id: 300, title: "a-first" } });

    const rows = await db.read(users_as, {
      where: { id: 300 },
      with: {
        posts: {
          as: posts_as,
          kind: "many",
          fk: "user_id",
          reverse: false,
          where: {},
          sort: { title: "asc" },  // important
          limit: 1,                // important (forces window path)
        },
      },
    }) as any[];

    assert(rows.length).equals(1);
    assert(rows[0].posts.length).equals(1);

    // correct behaviour: smallest title
    assert(rows[0].posts[0].title).equals("a-first");
  });
});

test.case("relation query includes user where", async assert => {
  await $(async () => {
    await db.create(users_as, { record: { id: 300, name: "test", age: 25 } });
    await db.create(posts_as, { record: { id: 300, user_id: 300, title: "hello" } });

    await db.read(users_as, {
      where: { id: 300 },
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
    assert(db.explain.posts.query).includes("`title`=$title");
  });
});

test.case("relation query includes sort", async assert => {
  await $(async () => {
    await db.create(users_as, { record: { id: 301, name: "test", age: 25 } });
    await db.create(posts_as, { record: { id: 301, user_id: 301, title: "post" } });

    await db.read(users_as, {
      where: { id: 301 },
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
    assert(db.explain.posts.query).includes("ORDER BY");
    assert(db.explain.posts.query).includes("`title` DESC");
  });
});

test.case("relation query includes field projection", async assert => {
  await $(async () => {
    await db.create(users_as, { record: { id: 302, name: "test", age: 25 } });
    await db.create(posts_as, { record: { id: 302, user_id: 302, title: "post" } });

    await db.read(users_as, {
      where: { id: 302 },
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

    // should select title + join column (user_id)
    assert(db.explain.users.query).includes("LEFT JOIN");
    assert(db.explain.users.query).includes("`title`");
    assert(db.explain.users.query).includes("`user_id`");
    assert(db.explain.users.query).not.includes("*");
  });
});

test.case("relation plan uses index on FK", async assert => {
  await $(async () => {
    await db.create(users_as, { record: { id: 303, name: "test", age: 25 } });
    await db.create(posts_as, { record: { id: 303, user_id: 303, title: "post" } });

    await db.read(users_as, {
      where: { id: 303 },
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
    // SQLite doesn't auto-index FKs, so this will SCAN
    // if it had an index, it would SEARCH
    assert(db.explain.users.plan.some(p => p.includes("SCAN"))).true();
  });
});

test.case("relation kind=one uses window function", async assert => {
  await $(async () => {
    await db.create(users_as, { record: { id: 305, name: "test", age: 25 } });
    await db.create(posts_as, { record: { id: 307, user_id: 305, title: "post 1" } });
    await db.create(posts_as, { record: { id: 308, user_id: 305, title: "post 2" } });

    await db.read(users_as, {
      where: { id: 305 },
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

    // target: kind=one should also use ROW_NUMBER with limit 1
    assert(db.explain.posts.query).includes("ROW_NUMBER()");
  });
});

relation_query_has("relation with where uses IN clause (phased)",
  async () => {
    await db.create(users_as, { record: { id: 400, name: "test", age: 25 } });
    await db.create(posts_as, { record: { id: 400, user_id: 400, title: "post" } });
    await db.read(users_as, {
      where: { id: 400 },
      with: {
        posts: {
          as: posts_as,
          kind: "many",
          fk: "user_id",
          reverse: false,
          where: { title: "post" },  // forces phased strategy
        },
      },
    });
  },
  "posts",
  ["IN ("],
);
