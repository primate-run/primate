import type DB from "#db/DB";
import key from "#orm/key";
import relation from "#orm/relation";
import Store from "#orm/Store";
import type { Asserter } from "@rcompat/test";
import test from "@rcompat/test";
import any from "@rcompat/test/any";
import type { Dict } from "@rcompat/type";
import p from "pema";

type ThrowsFn = (assert: Asserter, fn: () => Promise<any>) => Promise<any>;
type Body = (assert: Asserter) => Promise<void>;

const BAD_WHERE: {
  label: string;
  base: Dict;
  with: Dict;
  expected?: string;
}[] = [
    {
      label: "reject array criteria value",
      base: { name: ["Donald"] },
      with: { title: ["foo a"] },
    },
    {
      label: "reject empty operator object",
      base: { name: {} },
      with: { title: {} },
    },
    {
      label: "reject undefined criteria value",
      base: { age: undefined },
      with: { title: undefined },
    },
    {
      label: "reject unknown operator",
      base: { name: { $nope: "x" } },
      with: { title: { $nope: "x" } },
      expected: "unknown operator",
    },
  ];

const BAD_SELECT: {
  label: string;
  base: unknown[];
  with: unknown[];
  expected?: string;
}[] = [
    {
      label: "reject empty select",
      base: [],
      with: [],
      expected: "empty select",
    },
    {
      label: "reject unknown select column",
      base: ["nope"],
      with: ["nope"],
      expected: "unknown select field",
    },
    {
      label: "reject duplicate select fields",
      base: ["id", "id"],
      with: ["id", "id"],
      expected: "duplicate select field",
    },
  ];

const BAD_SORT: {
  label: string;
  base: Dict;
  with: Dict;
  expected?: string;
}[] = [
    {
      label: "reject empty sort",
      base: {},
      with: {},
      expected: "empty sort",
    },
    {
      label: "reject unknown sort column",
      base: { nope: "asc" },
      with: { nope: "asc" },
      expected: "unknown sort field",
    },
    {
      label: "reject invalid direction",
      base: { age: "ascending" },
      with: { title: "ascending" },
      expected: "invalid sort direction",
    },
    {
      label: "reject undefined direction",
      base: { age: undefined },
      with: { title: undefined },
      expected: "invalid sort direction",
    },
  ];

const BAD_WHERE_COLUMN: {
  label: string;
  base: Dict;
  with: Dict;
  expected?: string;
}[] = [
    {
      label: "reject unknown criteria column",
      base: { nope: "x" },
      with: { nope: "x" },
      expected: "unknown field",
    },
  ];

function pick<
  D extends Dict,
  P extends (keyof D)[],
>(record: D, ...projection: P): Pick<D, P[number]> {
  return Object.fromEntries(
    Object.entries(record).filter(([k]) => projection.includes(k as keyof D)),
  ) as Pick<D, P[number]>;
}

async function throws(assert: Asserter, fn: () => Promise<any>) {
  try {
    await fn();
    assert(false).true();
  } catch (error) {
    assert(true).true();
    return error;
  }
}

async function throws_message(
  assert: Asserter,
  expected: string,
  fn: () => Promise<any>,
) {
  try {
    await fn();
    assert(false).true();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert(message.includes(expected)).true();
  }
}

const USERS = {
  ben: { age: 60, lastname: "Miller", name: "Ben" },
  donald: { age: 30, lastname: "Duck", name: "Donald" },
  jeremy: { age: 20, name: "Just Jeremy" },
  paul: { age: 40, lastname: "Miller", name: "Paul" },
  ryan: { age: 40, lastname: "Wilson", name: "Ryan" },
};
type User = keyof typeof USERS;

export default <D extends DB>(db: D) => {
  test.ended(() => db.close());

  const Post = new Store({
    id: key.primary(p.string),
    title: p.string,
    user_id: p.uint,
  }, { db, name: "post" });

  Post.update;

  const User = new Store({
    id: key.primary(p.string),
    age: p.u8.optional(),
    lastname: p.string.optional(),
    name: p.string.default("Donald"),
  }, { db: db, name: "user" });

  const UserN = new Store({
    id: key.primary(p.u32),
    age: p.u8.optional(),
    lastname: p.string.optional(),
    name: p.string.default("Donald"),
  }, { db: db, name: "user_n" });

  const UserB = new Store({
    id: key.primary(p.u128),
    age: p.u8.optional(),
    lastname: p.string.optional(),
    name: p.string.default("Donald"),
  }, { db: db, name: "user_b" });

  const USER_STORES = [User, UserN, UserB];

  const Type = new Store({
    id: key.primary(p.string),
    boolean: p.boolean.optional(),
    date: p.date.optional(),
    f32: p.f32.optional(),
    f64: p.f64.optional(),
    i128: p.i128.optional(),
    i16: p.i16.optional(),
    i32: p.i32.optional(),
    i64: p.i64.optional(),
    i8: p.i8.optional(),
    string: p.string.optional(),
    u128: p.u128.optional(),
    u16: p.u16.optional(),
    u32: p.u32.optional(),
    u64: p.u64.optional(),
    u8: p.u8.optional(),
  }, { db: db, name: "type" });

  // this stresses identifier quoting in CREATE/INSERT/SELECT/UPDATE/DELETE
  const Reserved = new Store({
    id: key.primary(p.string),
    // deliberately reserved-looking column name
    order: p.u8.optional(),
    name: p.string,
  }, { db: db, name: "select" }); // deliberately reserved-like table name

  const AuthorSchema = {
    id: key.primary(p.string),
    name: p.string,
  };

  const ArticleSchema = {
    id: key.primary(p.string),
    title: p.string,
    author_id: key.foreign(p.string),
  };

  const ProfileSchema = {
    id: key.primary(p.string),
    bio: p.string,
    author_id: key.foreign(p.string),
  };

  const Author = new Store(AuthorSchema, {
    db,
    name: "author",
    relations: {
      articles: relation.many(ArticleSchema, "author_id"),
      profile: relation.one(ProfileSchema, "author_id"),
    },
  });

  const Article = new Store(ArticleSchema, {
    db,
    name: "article",
    relations: {
      author: relation.one(AuthorSchema, "author_id", { reverse: true }),
    },
  });

  const Profile = new Store(ProfileSchema, {
    db,
    name: "profile",
    relations: {
      author: relation.one(AuthorSchema, "author_id", { reverse: true }),
    },
  });

  function $store<S extends Store<any>>(label: string, store: S, body: Body) {
    test.case(label, async assert => {
      await store.collection.create();
      try {
        await body(assert);
      } finally {
        await store.collection.delete();
      }
    });
  }

  function $user(label: string, body: Body) {
    test.case(label, async assert => {
      for (const S of USER_STORES) await S.collection.create();

      try {
        for (const u of Object.values(USERS)) {
          for (const S of USER_STORES) await S.insert(u);
        }
        await body(assert);
      } finally {
        for (const S of USER_STORES) await S.collection.delete();
      }
    });
  }

  function $user$(label: string, body: Body) {
    $user(`security - ${label}`, body);
  }

  function $type(label: string, body: Body) {
    $store(`type - ${label}`, Type, body);
  }

  function $rel(label: string, body: Body) {
    test.case(`relation - ${label}`, async assert => {
      await Author.collection.create();
      await Article.collection.create();
      await Profile.collection.create();

      try {
        const john = await Author.insert({ name: "John" });
        const bob = await Author.insert({ name: "Bob" });
        const ned = await Author.insert({ name: "Ned" });
        const jid = john.id;
        const bid = bob.id;
        const nid = ned.id;

        await Article.insert({ title: "John First Post", author_id: jid });
        await Article.insert({ title: "John Second Post", author_id: jid });
        await Article.insert({ title: "Bob Only Post", author_id: bid });

        await Profile.insert({ bio: "John is a writer", author_id: jid });

        const ts = ["foo a", "foo c", "foo d", "foo e", "foo f", "foo g"];
        for (const title of ts) await Article.insert({ title, author_id: jid });
        await Article.insert({ title: "bar x", author_id: jid });

        await Article.insert({ title: "foo b", author_id: bid });
        await Article.insert({ title: "bar y", author_id: bid });

        await Article.insert({ title: "bar z", author_id: nid });

        await body(assert);
      } finally {
        await Profile.collection.delete();
        await Article.collection.delete();
        await Author.collection.delete();
      }
    });
  }

  function $rel$(label: string, body: Body) {
    $rel(`security - ${label}`, body);
  }
  function security_pair<Base, With>(
    base_prefix: "where" | "find",
    label: string,
    mk: () => { base: Base; with: With },
    run_base: (base: Base) => Promise<any>,
    run_with: (w: With) => Promise<any>,
    opts?: { throws?: ThrowsFn; expected?: string },
  ) {
    const run: ThrowsFn =
      opts?.expected
        ? (a, fn) => throws_message(a, opts.expected!, fn)
        : (opts?.throws ?? throws);

    $user$(`${base_prefix}: ${label}`, async assert => {
      const { base } = mk();
      await run(assert, () => run_base(base));
    });

    $rel$(`with: ${base_prefix}: ${label}`, async assert => {
      const { with: w } = mk();
      await run(assert, () => run_with(w));
    });
  }

  function bad_where(
    label: string,
    mk: () => { base: Dict; with: Dict },
    opts?: { throws?: ThrowsFn; expected?: string },
  ) {
    return security_pair(
      "where",
      label,
      mk,
      base => User.find({ where: base }),
      w => Author.find({ with: { articles: { where: w } } }),
      opts,
    );
  }

  function bad_select(
    label: string,
    mk: () => { base: any; with: any },
    opts?: { throws?: ThrowsFn; expected?: string },
  ) {
    return security_pair(
      "find",
      label,
      mk,
      base => User.find({ select: base }),
      w => Author.find({ with: { articles: { select: w } } }),
      opts,
    );
  }

  function bad_sort(
    label: string,
    mk: () => { base: any; with: any },
    opts?: { throws?: ThrowsFn; expected?: string },
  ) {
    return security_pair(
      "find",
      label,
      mk,
      base => User.find({ sort: base }),
      w => Author.find({ with: { articles: { sort: w } } }),
      opts,
    );
  }

  $store("insert", User, async assert => {
    const donald = await User.insert({ age: 30, name: "Donald" });
    assert(donald).type<{
      id: string;
      age?: number;
      lastname?: string;
      name: string;
    }>();
    assert(await User.has(donald.id)).true();

    const ryan = await User.insert({ age: 40, name: "Ryan" });
    assert(await User.has(donald.id)).true();
    assert(await User.has(ryan.id)).true();
  });

  $store("insert - primary key is optional (string)", User, async assert => {
    const user = await User.insert({ name: "Test" });
    assert(user.id).type<string>();
    assert(await User.has(user.id)).true();
  });

  $store("insert - primary key is optional (number)", UserN, async assert => {
    const user = await UserN.insert({ name: "Test" });
    assert(user.id).type<number>();
    assert(await UserN.has(user.id)).true();
  });

  $store("insert - primary key is optional (bigint)", UserB, async assert => {
    const user = await UserB.insert({ name: "Test" });
    assert(user.id).type<bigint>();
    assert(await UserB.has(user.id)).true();
  });

  $store("insert - defaults apply", User, async assert => {
    const u = await User.insert({} as any);
    assert(u.name).equals("Donald");
  });

  $user("find - empty object equals no options", async assert => {
    const a = await User.find();
    const b = await User.find({});
    assert(a.length).equals(b.length);
  });

  $user("find - $like: handles regex metacharacters", async assert => {
    await User.insert({ name: "A[1]" });

    const got = await User.find({
      where: { name: { $like: "A[1]" } },
      select: ["name"],
    });

    assert(got.length).equals(1);
    assert(got[0].name).equals("A[1]");
  });

  $user("find - types", async assert => {
    const where = { name: "Ryan" };
    assert(await User.find({ where })).type<{
      id: string;
      age?: number;
      lastname?: string;
      name: string;
    }[]>();
    assert(await UserN.find({ where })).type<{
      id: number;
      age?: number;
      lastname?: string;
      name: string;
    }[]>();
    assert(await UserB.find({ where })).type<{
      id: bigint;
      age?: number;
      lastname?: string;
      name: string;
    }[]>();
  });

  $user("find - select narrows type", async assert => {
    const select = ["id", "name"] as const;

    const users = await User.find({ select });
    assert(users).type<{ id: string; name: string }[]>();

    const users_n = await UserN.find({ select });
    assert(users_n).type<{ id: number; name: string }[]>();

    const users_b = await UserB.find({ select });
    assert(users_b).type<{ id: bigint; name: string }[]>();
  });

  $user("find - basic query", async assert => {
    const result = await User.find({ where: { name: "Ryan" } });
    assert(result.length).equals(1);
  });

  $user("find - sorting by multiple fields", async assert => {
    // sorting by multiple fields: age descending, then Lastname ascending
    const sorted = await User.find({
      select: ["age", "name"],
      sort: { age: "desc", lastname: "asc" },
    });

    assert(sorted.length).equals(5);
    ["ben", "paul", "ryan", "donald", "jeremy"].forEach((user, i) => {
      assert(sorted[i]).equals(pick(USERS[user as User], "name", "age"));
    });

    const descending = await User.find({
      select: ["age", "name"],
      sort: { age: "desc", lastname: "desc" },
    });
    const descended = ["ben", "ryan", "paul", "donald", "jeremy"];
    descended.forEach((user, i) => {
      assert(descending[i]).equals(pick(USERS[user as User], "name", "age"));
    });
  });

  $user("find - sorting ascending and descending", async assert => {
    const ascending = await User.find({
      select: ["age", "name"],
      sort: { age: "asc" },
      limit: 2,
    });

    const ascended = ["jeremy", "donald"];
    ascended.forEach((user, i) => {
      assert(ascending[i]).equals(pick(USERS[user as User], "name", "age"));
    });

    const descending = await User.find({
      select: ["age", "name"],
      sort: { age: "desc" },
      limit: 1,
    });

    assert(descending[0]).equals(pick(USERS.ben, "name", "age"));
  });

  $user("find - null criteria uses IS NULL semantics", async assert => {
    // inserted fixtures include Jeremy without a lastname (NULL in DB)
    // querying with { lastname: null } should find him
    const rows = await User.find({
      select: ["name", "lastname"],
      where: { lastname: null },
      sort: { name: "asc" },
    });
    assert(rows.length).equals(1);

    if (rows.length > 0) {
      assert(rows[0].name).equals("Just Jeremy");
    }
  });

  $user("find - $like operator for strings", async assert => {
    const prefix = await User.find({ where: { name: { $like: "J%" } } });
    assert(prefix.length).equals(1);
    if (prefix.length > 0) assert(prefix[0].name).equals("Just Jeremy");

    const suffix = await User.find({ where: { lastname: { $like: "%er" } } });
    assert(suffix.length).equals(2);
    const lastnames = suffix.map(u => u.lastname).sort();
    assert(lastnames).equals(["Miller", "Miller"]);

    const contains = await User.find({ where: { name: { $like: "%on%" } } });
    assert(contains.length).equals(1);
    if (contains.length > 0) assert(contains[0].name).equals("Donald");

    const exact = await User.find({ where: { name: { $like: "Ryan" } } });
    assert(exact.length).equals(1);
    if (exact.length > 0) assert(exact[0].name).equals("Ryan");

    const none = await User.find({ where: { name: { $like: "xyz%" } } });
    assert(none.length).equals(0);
  });

  $user("find - $like with null/undefined fields", async assert => {
    // Jeremy has no lastname (null), should not match ANY $like patterns
    const results = await User.find({
      where: { lastname: { $like: "%ll%" } },
    });
    assert(results.length).equals(2); // Ben, Paul

    const names = results.map(u => u.name).sort();
    assert(names).equals(["Ben", "Paul"]);
  });

  $user("find - $like: reject non-string types", async assert => {
    await throws(assert, () => {
      // age is u8, should not accept $like
      return User.find({ where: { age: { $like: "30%" } } } as any);
    });
  });

  $user("update - single record", async assert => {
    const [donald] = (await User.find({ where: { name: "Donald" } }));

    await User.update(donald.id, { set: { age: 35 } });

    const [updated] = (await User.find({ where: { name: "Donald" } }));
    assert(updated.age).equals(35);
    assert(updated).equals({ ...USERS.donald, age: 35, id: donald.id });
  });

  $user("update - unset fields", async assert => {
    const [donald] = (await User.find({ where: { name: "Donald" } }));

    assert(donald.age).equals(30);
    await User.update(donald.id, { set: { age: null } });

    const [updated] = (await User.find({ where: { name: "Donald" } }));
    assert(updated.age).undefined();

    const [paul] = (await User.find({ where: { name: "Paul" } }));
    await User.update(paul.id, { set: { age: null, lastname: null } });

    const [updated_paul] = (await User.find({ where: { name: "Paul" } }));
    assert(updated_paul).equals({ id: updated_paul.id, name: "Paul" });
  });

  $user("update - multiple records", async assert => {
    const n_updated = await User.update({
      where: { age: 40 },
      set: { age: 45 },
    });

    assert(n_updated).equals(2);

    const updated = await User.find({ where: { age: 45 } });
    assert(updated.length).equals(2);
  });

  $user("update - criteria and changeset share a column", async assert => {
    // Donald has age 30; update age using criteria on the same column
    const n = await User.update({ where: { age: 30 }, set: { age: 31 } });
    assert(n).equals(1);

    assert(await User.count({ where: { age: 30 } })).equals(0);
    assert(await User.count({ where: { age: 31 } })).equals(1);

    const [donald] = await User.find({ where: { name: "Donald" } });
    assert(donald.age).equals(31);
  });

  $user("update - update all", async assert => {
    await User.update({ set: { age: 99 } });
    const users = await User.find();
    for (const user of users) assert(user.age!).equals(99);
  });

  $user("update - $like criteria", async assert => {
    // update all users whose names start with "J"
    const updated = await User.update({
      where: { name: { $like: "J%" } },
      set: { age: 25 },
    });
    assert(updated).equals(1);

    const jeremy = await User.find({ where: { name: "Just Jeremy" } });
    assert(jeremy[0].age).equals(25);
  });

  $user("delete - single record", async assert => {
    const [donald] = await User.find({ where: { name: "Donald" } });
    await User.delete(donald.id);

    const deleted = await User.find({ where: { name: "Donald" } });
    assert(deleted.length).equals(0);
  });

  $user("delete - multiple records", async assert => {
    const n = await User.delete({ where: { age: 40 } });
    assert(n).equals(2);

    const remaining = await User.find({ sort: { age: "asc" } });
    assert(remaining.length).equals(3);
    assert(remaining[0].name).equals("Just Jeremy");
  });

  $user("delete - $like criteria", async assert => {
    // delete all users with "Miller" lastname
    const deleted = await User.delete({
      where: { lastname: { $like: "%Miller%" } },
    });
    assert(deleted).equals(2);

    const remaining = await User.find();
    assert(remaining.length).equals(3);

    const remainingNames = remaining.map(u => u.name).sort();
    assert(remainingNames).equals(["Donald", "Just Jeremy", "Ryan"]);
  });

  $user("count", async assert => {
    assert(await User.count()).equals(5);
    assert(await User.count({ where: { name: "Ryan" } })).equals(1);
    assert(await User.count({ where: { age: 40 } })).equals(2);
    assert(await User.count({ where: { age: 30 } })).equals(1);
    assert(await User.count({ where: { age: 35 } })).equals(0);
  });

  $user("count - $like operator", async assert => {
    assert(await User.count({ where: { name: { $like: "J%" } } })).equals(1);
    assert(await User.count({ where: { lastname: { $like: "%er" } } }))
      .equals(2);
    assert(await User.count({ where: { name: { $like: "%xyz%" } } }))
      .equals(0);
  });

  $user("has", async assert => {
    const [donald] = await User.find({ where: { name: "Donald" } });

    assert(await User.has(donald.id)).true();
    await User.delete(donald.id);
    assert(await User.has(donald.id)).false();
  });

  $type("boolean", async assert => {
    const t = await Type.insert({ boolean: true });
    assert(t.boolean).equals(true);
    assert((await Type.get(t.id)).boolean).equals(true);

    await Type.update(t.id, { set: { boolean: false } });
    assert((await Type.get(t.id)).boolean).equals(false);
  });

  $type("string", async assert => {
    const t = await Type.insert({ string: "foo" });
    assert(t.string).equals("foo");
    assert((await Type.get(t.id)).string).equals("foo");

    await Type.update(t.id, { set: { string: "bar" } });
    assert((await Type.get(t.id)).string).equals("bar");
  });

  $type("date", async assert => {
    const now = new Date();
    const t = await Type.insert({ date: now });
    assert(t.date?.getTime()).equals(now.getTime());
    assert((await Type.get(t.id)).date?.getTime()).equals(now.getTime());

    const next = new Date();

    await Type.update(t.id, { set: { date: next } });
    assert((await Type.get(t.id)).date).equals(next);
  });

  $type("f32", async assert => {
    const t = await Type.insert({ f32: 1.5 });
    assert(t.f32).equals(1.5);
    assert((await Type.get(t.id)).f32).equals(1.5);

    await Type.update(t.id, { set: { f32: 123456.75 } });
    assert((await Type.get(t.id)).f32).equals(123456.75);
  });

  $type("f64", async assert => {
    const f1 = 123456.78901;
    const t = await Type.insert({ f64: f1 });
    assert(t.f64).equals(f1);
    assert((await Type.get(t.id)).f64).equals(f1);

    await Type.update(t.id, { set: { f32: 1.5 } });
    assert((await Type.get(t.id)).f32).equals(1.5);
  });

  [8, 16, 32].forEach(n => {
    $type(`i${n}`, async assert => {
      const k = `i${n}`;

      // lower bound
      const lb = -(2 ** (n - 1));
      const t = await Type.insert({ [k]: lb });
      assert(t[any(k)]).equals(lb);
      assert((await Type.get(t.id))[any(k)]).equals(lb);

      // upper bound
      const ub = 2 ** (n - 1) - 1;
      await Type.update(t.id, { set: { [k]: ub } });
      assert((await Type.get(t.id))[any(k)]).equals(ub);
    });

    $type(`u${n}`, async assert => {
      const k = `u${n}`;

      // lower bound
      const lb = 0;
      const t = await Type.insert({ [k]: lb });
      assert(t[any(k)]).equals(lb);
      assert((await Type.get(t.id))[any(k)]).equals(lb);

      // upper bound
      const ub = 2 ** n - 1;
      await Type.update(t.id, { set: { [k]: ub } });
      assert((await Type.get(t.id))[any(k)]).equals(ub);
    });
  });

  [64n, 128n].forEach(i => {
    $type(`i${i}`, async assert => {
      const k = `i${i}`;

      // lower bound
      const lb = -(2n ** (i - 1n));
      const t = await Type.insert({ [k]: lb });
      assert(t[any(k)]).equals(lb);
      assert((await Type.get(t.id))[any(k)]).equals(lb);

      // upper bound
      const ub = 2n ** (i - 1n) - 1n;
      const tu = await Type.insert({ [k]: ub });
      assert(tu[any(k)]).equals(ub);
      assert((await Type.get(tu.id))[any(k)]).equals(ub);
    });

    $type(`u${i}`, async assert => {
      const k = `u${i}`;

      // lower bound
      const lb = 0n;
      const t = await Type.insert({ [k]: lb });
      assert(t[any(k)]).equals(lb);
      assert((await Type.get(t.id))[any(k)]).equals(lb);

      // upper bound
      const ub = 2n ** i - 1n;
      const tu = await Type.insert({ [k]: ub });
      assert(tu[any(k)]).equals(ub);
      assert((await Type.get(tu.id))[any(k)]).equals(ub);
    });
  });

  $user$("find: reject non-array select", async assert => {
    await throws_message(assert, "array", () => {
      return User.find({ select: {} as any });
    });
  });

  $user$("find: projection limits fields", async assert => {
    const records = await User.find({ select: ["id", "name"] });
    assert(records.length).equals(5);
    for (const r of records) {
      // only id + name must be present
      assert(Object.keys(r).toSorted()).equals(["id", "name"].toSorted());
    }
  });

  $user$("update: reject unknown change column", async assert => {
    const [donald] = await User.find({ where: { name: "Donald" } });
    await throws(assert, () => {
      return User.update(donald.id, { set: { nope: 1 } } as any);
    });
  });

  $user$("update: reject empty changes object", async assert => {
    const [donald] = await User.find({ where: { name: "Donald" } });
    await throws(assert, () => {
      return User.update(donald.id, { set: {} } as any);
    });
  });

  $user$("update: reject updating primary key", async assert => {
    const [donald] = await User.find({ where: { name: "Donald" } });
    await throws(assert, () => {
      return User.update(donald.id, { set: { id: "nope" } } as any);
    });
  });

  $user$("update: reject missing set", async assert => {
    await throws(assert, () => {
      return User.update({ where: { name: "Donald" } } as any);
    });
  });

  $user$("delete: reject missing criteria", async assert => {
    await throws(assert, () => {
      return User.delete({} as any);
    });
  });

  $user$("inject invalid identifier (criteria)", async assert => {
    // attempted injection via bogus key
    await throws(assert, () => {
      return User.find({ where: { "name; DROP TABLE user;": "x" } } as any);
    });
  });

  $user$("inject invalid identifier (select)", async assert => {
    await throws(assert, () => {
      return User.find({ select: ["name; DROP TABLE user;"] as any });
    });
  });

  $user$("value safety: does not interpolate values", async assert => {
    const evil = "x' ; DROP TABLE user; --";

    // should just behave like a normal string compare (0 matches), not explode
    const rows = await User.find({ where: { name: evil } });
    assert(rows.length).equals(0);

    // table should still exist / be queryable
    assert(await User.count()).equals(5);
  });

  $user$("update respects unset / binding map", async assert => {
    const [paul] = await User.find({ where: { name: "Paul" } });
    // allowed, lastname is optional
    await User.update(paul.id, { set: { lastname: null } });
    const [after] = await User.find({
      select: ["id", "name", "lastname"],
      where: { id: paul.id },
    });
    assert(after.lastname).undefined();
  });

  $user$("count: reject unknown criteria column", async assert => {
    await throws(assert, () => {
      return User.count({ where: { nope: 1 } } as any);
    });
  });

  $user$("$like: reject unknown field", async assert => {
    await throws(assert, () => {
      return User.find({ where: { unknown: { $like: "test%" } } } as any);
    });
  });

  $user$("insert: reject unknown column", async assert => {
    await throws(assert, () => User.insert({ name: "X", nope: 1 } as any));
  });

  $user$("update: reject unknown where column", async assert => {
    await throws(assert, () => User.update({
      where: { nope: 1 } as any,
      set: { age: 1 },
    }));
  });

  $user$("delete: reject unknown where column", async assert => {
    await throws(assert, () => User.delete({ where: { nope: 1 } as any }));
  });

  /*$user$("number operators: reject on non-number fields", async assert => {
    await throws(assert, () => {
      // name is string, should not accept $gte
      return User.find({ name: { $gte: 10 } } as any);
    });
  });*/

  /*$user$("mixed operators: reject invalid combinations", async assert => {
    await throws(assert, () => {
      // can't mix string and number operators
      return User.find({ name: { $like: "test%", $gte: 5 } } as any);
    });
  });*/

  $store("reserved table / column names", Reserved, async assert => {
    const a = await Reserved.insert({ name: "alpha", order: 1 });
    const b = await Reserved.insert({ name: "beta", order: 2 });

    const got = await Reserved.find({ where: { name: "alpha" } });
    assert(got.length).equals(1);
    assert(got[0]).equals({ id: a.id, name: "alpha", order: 1 });

    // update using the reserved column
    const n = await Reserved.update({
      where: { name: "beta" },
      set: { order: 9 },
    });
    assert(n).equals(1);

    const [after] = await Reserved.find({ where: { id: b.id } });
    assert(after.order).equals(9);

    // and delete to complete the cycle
    await Reserved.delete(a.id);
    assert(await Reserved.has(a.id)).false();
  });

  $rel("get with one (reverse)", async assert => {
    const articles = await Article.find();
    const article = await Article.get(articles[0].id, {
      with: {
        author: true,
      },
    });

    assert(article).type<{
      id: string;
      title: string;
      author_id: string;
      author: null | {
        id: string;
        name: string;
      };
    }>();
    assert(article.author).not.null();
    assert(article.author?.name).defined();
  });

  $rel("get with many", async assert => {
    const [first] = await Author.find({ where: { name: "John" } });
    const john = await Author.get(first.id, { with: { articles: true } });

    assert(john.articles).type<{
      id: string;
      title: string;
      author_id: string;
    }[]>();
    const titles = john.articles.map(a => a.title);
    assert(titles.includes("John First Post")).true();
    assert(titles.includes("John Second Post")).true();
  });

  $rel("get by id", async assert => {
    const [first] = await Author.find({ where: { name: "John" } });
    const john = await Author.get(first.id, { with: { profile: true } });

    assert(john.profile).not.null();
    assert(john.profile?.bio).equals("John is a writer");
  });

  $rel("get by id returns null when missing", async assert => {
    const [first] = await Author.find({ where: { name: "Bob" } });
    const bob = await Author.get(first.id, { with: { profile: true } });

    assert(bob.profile).null();
  });

  $rel("find", async assert => {
    const articles = await Article.find({
      where: { title: { $like: "% Post" } },
      with: { author: true },
      sort: { title: "asc" },
    });

    assert(articles.length).equals(3);
    for (const article of articles) {
      assert(article.author).not.null();
      assert(article.author?.name).defined();
    }
  });

  $rel("try", async assert => {
    const [first] = await Article.find();
    const article = await Article.try(first.id, { with: { author: true } });

    assert(article).defined();
    assert(article?.author).not.null();
  });

  $rel("many returns empty array when no matches", async assert => {
    // insert author with no articles
    const lonely = await Author.insert({ name: "Lonely" });
    const author = await Author.get(lonely.id, { with: { articles: true } });

    assert(author.articles).type<{
      id: string;
      title: string;
      author_id: string;
    }[]>();
    assert(author.articles.length).equals(0);
  });

  $rel("multiple relations in one query", async assert => {
    const authors = await Author.find({ where: { name: "John" } });
    const john = await Author.get(authors[0].id, {
      with: {
        articles: true,
        profile: true,
      },
    });

    const titles = john.articles.map(a => a.title);
    assert(titles.includes("John First Post")).true();
    assert(titles.includes("John Second Post")).true();
    assert(john.profile).not.null();
    assert(john.profile?.bio).equals("John is a writer");
  });

  $rel("no fields without 'with'", async assert => {
    const articles = await Article.find();
    const article = await Article.get(articles[0].id);

    assert("author" in article).false();
  });

  $rel("find: complex relation subqueries", async assert => {
    const SUBLIMIT = 5;

    const authors = await Author.find({
      select: ["id", "name"],
      sort: { name: "asc" },
      limit: 20,
      with: {
        articles: {
          where: { title: { $like: "%foo%" } },
          select: ["id", "title"],
          sort: { title: "asc" },
          limit: SUBLIMIT,
        },
        profile: true,
      },
    });

    assert(authors).type<{
      id: string;
      name: string;
      articles: { id: string; title: string }[];
      profile: null | { id: string; bio: string; author_id: string };
    }[]>();

    // parents must *not* be filtered by relation where
    const base = await Author.find({
      select: ["id", "name"],
      sort: { name: "asc" },
      limit: 20,
    });
    assert(authors.map(r => r.name)).equals(base.map(r => r.name));

    // base projection is respected (only id/name + relation keys)
    for (const author of authors) {
      assert(Object.keys(author).toSorted()).equals(
        ["articles", "id", "name", "profile"].toSorted(),
      );
    }

    // per-parent relation correctness (filter + sort + limit)
    for (const author of authors) {
      // many => always array
      assert(Array.isArray(author.articles)).true();

      // projection + filter enforcement on returned relation rows
      for (const article of author.articles) {
        assert(Object.keys(article).toSorted()).equals(["id", "title"]
          .toSorted());
        assert(article.title.includes("foo")).true();
      }

      // relation sort asc by title
      const titles = author.articles.map(a => a.title);
      assert([...titles].toSorted()).equals(titles);

      // relation limit is per-parent
      assert(author.articles.length <= SUBLIMIT).true();

      // compare against base query (same semantics, explicit per-parent)
      const expected = await Article.find({
        where: { author_id: author.id, title: { $like: "%foo%" } },
        select: ["id", "title"],
        sort: { title: "asc" },
      });
      const expected_titles = expected.slice(0, SUBLIMIT).map(a => a.title);
      assert(titles).equals(expected_titles);

      // profile: one => null or full record, FK must point back
      if (author.profile !== null) {
        assert(Object.keys(author.profile).toSorted()).equals(
          ["author_id", "bio", "id"].toSorted(),
        );
        assert(author.profile.author_id).equals(author.id);
      }
    }

    // ensure the inner limit was actually used (needs > SUBLIMIT matches)
    let used = false;
    for (const author of authors) {
      const n_foo = await Article.count({
        where: { author_id: author.id, title: { $like: "%foo%" } },
      });
      if (n_foo > SUBLIMIT) used = true;
    }
    assert(used).true();

    const john = authors.find(r => r.name === "John");
    if (john !== undefined) {
      assert(john.profile).not.null();
      assert(john.profile?.bio).equals("John is a writer");
    }

    // parent with *zero* matching related rows must still be present,
    // and the many-relation must be [] (not missing / not null)
    const ned = authors.find(a => a.name === "Ned");
    assert(ned).defined();

    assert(ned!.articles).type<{ id: string; title: string }[]>();
    assert(ned!.articles.length).equals(0);

    // and one-relation should be null when missing
    assert(ned!.profile).null();
  });

  $rel("type: select narrows nested types", async assert => {
    const rows = await Author.find({
      select: ["id"],
      with: {
        profile: { select: ["bio"] },
        articles: { select: ["title"] },
      },
    });

    assert(rows).type<{
      id: string;
      profile: null | { bio: string };
      articles: { title: string }[];
    }[]>();

    // runtime: selected base only has id (plus relation keys)
    for (const r of rows) assert("name" in r).false();
  });

  $rel$("with: reject unknown relation name", async assert => {
    await throws(assert, () => {
      return Author.find({ with: { nope: true } as any });
    });
  });

  $user("get/try - missing id", async assert => {
    const missing = `missing-${Date.now()}-${Math.random()}`;

    await throws(assert, () => User.get(missing));
    assert(await User.try(missing)).undefined();
  });

  $rel("get/try - missing id (with relations)", async assert => {
    const missing = `missing-${Date.now()}-${Math.random()}`;

    await throws(assert, () => Article.get(missing,
      { with: { author: true } }));
    assert(await Article.try(missing, { with: { author: true } })).undefined();
  });

  $rel("get/try - missing id (+ parent)", async assert => {
    const missing = `missing-${Date.now()}-${Math.random()}`;

    await throws(assert, () => Author.get(missing, {
      with: { articles: true, profile: true },
    }));
    assert(await Author.try(missing, {
      with: { articles: true, profile: true },
    })).undefined();
  });

  $user("try - does not swallow invalid options", async assert => {
    const [u] = await User.find({ select: ["id"] });

    await throws_message(assert, "empty select", () => {
      // programmer error: should throw, not return undefined
      return User.try(u.id, { select: [] as any });
    });
  });

  $type("where - treat date as literal value (not operator)", async assert => {
    const d = new Date();

    const inserted = await Type.insert({ date: d });

    // to be treated as equality, not operator parsing.
    const got = await Type.find({ where: { date: new Date(d.getTime()) } });

    assert(got.length).equals(1);
    assert(got[0].id).equals(inserted.id);
  });

  $type("where - number operators ($gt/$gte/$lt/$lte/$ne)", async assert => {
    // use a marker to avoid cross-test interference if the DB isn't reset
    await Type.insert({ string: "ops-num", u8: 201 });
    await Type.insert({ string: "ops-num", u8: 202 });
    await Type.insert({ string: "ops-num", u8: 203 });

    const gt = await Type.find({
      where: { string: "ops-num", u8: { $gt: 201 } },
      sort: { u8: "asc" },
    });
    assert(gt.map(r => (r as any).u8)).equals([202, 203]);

    const between = await Type.find({
      where: { string: "ops-num", u8: { $gte: 202, $lt: 203 } },
    });
    assert(between.length).equals(1);
    assert((between[0] as any).u8).equals(202);

    const ne = await Type.find({
      where: { string: "ops-num", u8: { $ne: 202 } },
      sort: { u8: "asc" },
    });
    assert(ne.map(r => (r as any).u8)).equals([201, 203]);

    const lte = await Type.find({
      where: { string: "ops-num", u8: { $lte: 202 } },
      sort: { u8: "asc" },
    });
    assert(lte.map(r => (r as any).u8)).equals([201, 202]);
  });

  $type("where - bigint operators ($gt/$gte/$lt/$lte/$ne)", async assert => {
    await Type.insert({ string: "ops-big", u64: 201n });
    await Type.insert({ string: "ops-big", u64: 202n });
    await Type.insert({ string: "ops-big", u64: 203n });

    const gt = await Type.find({
      where: { string: "ops-big", u64: { $gt: 201n } },
      sort: { u64: "asc" },
    });
    assert(gt.map(r => (r as any).u64)).equals([202n, 203n]);

    const between = await Type.find({
      where: { string: "ops-big", u64: { $gte: 202n, $lt: 203n } },
    });
    assert(between.length).equals(1);
    assert((between[0] as any).u64).equals(202n);

    const ne = await Type.find({
      where: { string: "ops-big", u64: { $ne: 202n } },
      sort: { u64: "asc" },
    });
    assert(ne.map(r => (r as any).u64)).equals([201n, 203n]);
  });

  $type("where - datetime operators ($before/$after/$ne)", async assert => {
    const d1 = new Date("2020-01-01T00:00:00.000Z");
    const d2 = new Date("2020-01-02T00:00:00.000Z");
    const d3 = new Date("2020-01-03T00:00:00.000Z");

    await Type.insert({ string: "ops-date", date: d1 });
    await Type.insert({ string: "ops-date", date: d2 });
    await Type.insert({ string: "ops-date", date: d3 });

    const before = await Type.find({
      where: { string: "ops-date", date: { $before: d2 } },
      sort: { date: "asc" },
    });
    assert(before.map(r => (r as any).date.getTime())).equals([d1.getTime()]);

    const after = await Type.find({
      where: { string: "ops-date", date: { $after: d2 } },
      sort: { date: "asc" },
    });
    assert(after.map(r => (r as any).date.getTime())).equals([d3.getTime()]);

    const ne = await Type.find({
      where: { string: "ops-date", date: { $ne: d2 } },
      sort: { date: "asc" },
    });
    assert(ne.map(r => (r as any).date.getTime())).equals([d1.getTime(), d3.getTime()]);
  });

  $type("where - operator validation errors", async assert => {
    const throws_includes = async (needle: string, fn: () => any) => {
      try {
        await fn();
        assert(true).false(); // should not reach
      } catch (e) {
        const msg = String((e as any)?.message ?? e);
        assert(msg.includes(needle)).true();
      }
    };

    await throws_includes("empty operator object", () => {
      return Type.find({ where: { u8: {} as any } });
    });

    // string/time: only $like
    await throws_includes("unknown operator", () => {
      return Type.find({ where: { string: { $gt: 1 } as any } });
    });

    // number: no $like
    await throws_includes("unknown operator", () => {
      return Type.find({ where: { u8: { $like: "x" } as any } });
    });

    // datetime: no $gt
    await throws_includes("unknown operator", () => {
      return Type.find({ where: { date: { $gt: new Date() } as any } });
    });

    await throws_includes("invalid criteria", () => {
      return Type.find({ where: { u8: { $gt: "nope" } as any } });
    });

    await throws_includes("invalid criteria", () => {
      return Type.find({ where: { date: { $before: "nope" } as any } });
    });
  });

  $user("find - $like: underscore is single-character *", async assert => {
    await User.insert({ name: "A1" });
    await User.insert({ name: "A12" });

    const one = await User.find({
      where: { name: { $like: "A_" } },
      select: ["name"],
      sort: { name: "asc" },
    });
    assert(one.map(r => r.name)).equals(["A1"]);

    const two = await User.find({
      where: { name: { $like: "A__" } },
      select: ["name"],
      sort: { name: "asc" },
    });
    assert(two.map(r => r.name)).equals(["A12"]);
  });

  $user("find - $like: question mark is literal", async assert => {
    await User.insert({ name: "A?" });
    await User.insert({ name: "A1" });

    const got = await User.find({
      where: { name: { $like: "A?" } },
      select: ["name"],
      sort: { name: "asc" },
    });

    // '?' means only one character
    assert(got.map(r => r.name)).equals(["A?"]);
  });

  $rel("try - does not swallow invalid relation name", async assert => {
    const [row] = await Article.find({ select: ["id"] });

    await throws_message(assert, "unknown relation", () => {
      // programmer error: should throw, not return undefined
      return Article.try(row.id, { with: { nope: true } as any });
    });
  });

  $rel$("with: reject non-array relation select", async assert => {
    await throws_message(assert, "array", () => {
      return Author.find({
        with: {
          articles: {
            select: {} as any, // must be array
          },
        },
      } as any);
    });
  });

  $rel$("with: reject non-uint relation limit", async assert => {
    await throws(assert, () => {
      return Author.find({
        with: {
          articles: {
            limit: -1 as any, // must be uint
          },
        },
      } as any);
    });
  });

  $rel("one relation returns null when FK missing", async assert => {
    const orphan = await Article.insert({
      title: "Orphan",
      author_id: "missing-author",
    });

    const got = await Article.get(orphan.id, { with: { author: true } });
    assert(got.author).null();
  });

  $user("get/try - happy path", async assert => {
    const [u] = await User.find({ where: { name: "Donald" } });

    const got = await User.get(u.id);
    assert(got.id).equals(u.id);

    const tried = await User.try(u.id);
    assert(tried?.id).equals(u.id);
  });

  $rel("with + select (no id)", async assert => {
    const rows = await Author.find({
      select: ["name"],
      with: { articles: { select: ["title"], sort: { title: "asc" } } },
      sort: { name: "asc" },
    });

    // no id leaked
    for (const r of rows) assert("id" in r).false();

    // but relations are loaded
    const john = rows.find(r => r.name === "John")!;
    assert(Array.isArray(john.articles)).true();
    assert(john.articles.length > 0).true();
  });

  $rel("reverse one: with + select (no author_id) still loads relation",
    async assert => {
      const [row] = await Article.find({ select: ["id"] });

      const got = await Article.get(row.id, {
        select: ["title"],            // intentionally omit author_id
        with: { author: true },
      });

      assert("author_id" in got).false(); // stripped
      assert(got.author).not.null();
    });

  function ex(expected?: string) {
    return expected ? { expected } : undefined;
  }

  for (const c of BAD_WHERE) {
    bad_where(c.label, () => ({ base: c.base, with: c.with }), ex(c.expected));
  }

  for (const c of BAD_SELECT) {
    bad_select(c.label, () => ({ base: c.base, with: c.with }), ex(c.expected));
  }

  for (const c of BAD_SORT) {
    bad_sort(c.label, () => ({ base: c.base, with: c.with }), ex(c.expected));
  }

  for (const c of BAD_WHERE_COLUMN) {
    bad_where(c.label, () => ({ base: c.base, with: c.with }), ex(c.expected));
  }
};
