import type Database from "#database/Database";
import Store from "#database/Store";
import test from "@rcompat/test";
import any from "@rcompat/test/any";
import type Dict from "@rcompat/type/Dict";
import boolean from "pema/boolean";
import date from "pema/date";
import f32 from "pema/f32";
import f64 from "pema/f64";
import i128 from "pema/i128";
import i16 from "pema/i16";
import i32 from "pema/i32";
import i64 from "pema/i64";
import i8 from "pema/i8";
import optional from "pema/optional";
import primary from "pema/primary";
import string from "pema/string";
import u128 from "pema/u128";
import u16 from "pema/u16";
import u32 from "pema/u32";
import u64 from "pema/u64";
import u8 from "pema/u8";
import uint from "pema/uint";

function pick<
  D extends Dict,
  P extends string[],
>(record: D, ...projection: P) {
  return Object.fromEntries(Object.entries(record)
    .filter(([key]) => projection.includes(key)));
};

const users = {
  ben: { age: 60, lastname: "Miller", name: "Ben" },
  donald: { age: 30, lastname: "Duck", name: "Donald" },
  jeremy: { age: 20, name: "Just Jeremy" },
  paul: { age: 40, lastname: "Miller", name: "Paul" },
  ryan: { age: 40, lastname: "Wilson", name: "Ryan" },
} as const;
type User = keyof typeof users;

export default <D extends Database>(database: D) => {
  test.ended(() => database.close());

  const _Post = new Store({
    id: primary,
    title: string,
    user_id: uint,
  }, { database, name: "post" });

  _Post.update;

  const User = new Store({
    age: u8.optional(),
    id: primary,
    lastname: optional(string),
    name: string.default("Donald"),
  }, { database, name: "user" });

  const Type = new Store({
    boolean: boolean.optional(),
    date: date.optional(),
    f32: f32.optional(),
    f64: f64.optional(),
    i128: i128.optional(),
    i16: i16.optional(),
    i32: i32.optional(),
    i64: i64.optional(),
    i8: i8.optional(),
    id: primary,
    string: string.optional(),
    u128: u128.optional(),
    u16: u16.optional(),
    u32: u32.optional(),
    u64: u64.optional(),
    u8: u8.optional(),
  }, { database, name: "type" });

  const bootstrap = async (tester: () => Promise<void>) => {
    await User.schema.create();
    for (const user of Object.values(users)) {
      await User.insert(user);
    }
    await tester();
    await User.schema.delete();
  };

  const typestrap = async (tester: () => Promise<void>) => {
    await Type.schema.create();
    await tester();
    await Type.schema.delete();
  };

  test.case("insert", async assert => {
    await User.schema.create();

    const donald = await User.insert({ age: 30, name: "Donald" });
    assert(await User.has(donald.id)).true();

    const ryan = await User.insert({ age: 40, name: "Ryan" });
    assert(await User.has(donald.id)).true();
    assert(await User.has(ryan.id)).true();

    await User.schema.delete();
  });

  test.case("find - basic query", async assert => {
    await bootstrap(async () => {
      const result = await User.find({ name: "Ryan" });
      assert(result.length).equals(1);
      assert(result[0]).equals({ id: result[0].id, ...users.ryan });
    });
  });

  test.case("find - sorting by multiple fields", async assert => {
    await bootstrap(async () => {
      // sorting by multiple fields: age descending, then Lastname ascending
      const sorted = await User.find({}, {
        select: { age: true, name: true },
        sort: { age: "desc", lastname: "asc" },
      });

      assert(sorted.length).equals(5);
      ["ben", "paul", "ryan", "donald", "jeremy"].forEach((user, i) => {
        assert(sorted[i]).equals(pick(users[user as User], "name", "age"));
      });

      const descending = await User.find({}, {
        select: { age: true, name: true },
        sort: { age: "desc", lastname: "desc" },
      });
      const descended = ["ben", "ryan", "paul", "donald", "jeremy"];
      descended.forEach((user, i) => {
        assert(descending[i]).equals(pick(users[user as User], "name", "age"));
      });
    });
  });

  test.case("find - sorting ascending and descending", async assert => {
    await bootstrap(async () => {
      const ascending = await User.find({}, {
        limit: 2,
        select: { age: true, name: true },
        sort: { age: "asc" },
      });

      const ascended = ["jeremy", "donald"];
      ascended.forEach((user, i) => {
        assert(ascending[i]).equals(pick(users[user as User], "name", "age"));
      });

      const descending = await User.find({}, {
        limit: 1,
        select: { age: true, name: true },
        sort: { age: "desc" },
      });

      assert(descending[0]).equals(pick(users.ben, "name", "age"));
    });
  });

  test.case("find - limiting", async assert => {
    await bootstrap(async () => {
      const ascending = await User.find({}, {
        limit: 2,
        select: { age: true, name: true },
        sort: { age: "asc" },
      });

      assert(ascending.length).equals(2);
      const ascended = ["jeremy", "donald"];
      ascended.forEach((user, i) => {
        assert(ascending[i]).equals(pick(users[user as User], "name", "age"));
      });
    });
  });

  test.case("find - null criteria uses IS NULL semantics", async assert => {
    await bootstrap(async () => {
      // inserted fixtures include Jeremy without a lastname (NULL in DB)
      // querying with { lastname: null } should find him
      const rows = await User.find({ lastname: null }, {
        select: { name: true, lastname: true },
        sort: { name: "asc" },
      });
      assert(rows.length).equals(1);

      if (rows.length > 0) {
        assert(rows[0].name).equals("Just Jeremy");
      }
    });
  });

  test.case("update - single record", async assert => {
    await bootstrap(async () => {
      const [donald] = (await User.find({ name: "Donald" }));

      await User.update(donald.id, { age: 35 });

      const [updated] = (await User.find({ name: "Donald" }));
      assert(updated.age).equals(35);
      assert(updated).equals({ ...users.donald, age: 35, id: donald.id });
    });
  });

  test.case("update - unset fields", async assert => {
    await bootstrap(async () => {
      const [donald] = (await User.find({ name: "Donald" }));

      assert(donald.age).equals(30);
      await User.update(donald.id, { age: null });

      const [updated] = (await User.find({ name: "Donald" }));
      assert(updated.age).undefined();

      const [paul] = (await User.find({ name: "Paul" }));
      await User.update(paul.id, { age: null, lastname: null });

      const [updated_pual] = (await User.find({ name: "Paul" }));
      assert(updated_pual).equals({ id: updated_pual.id, name: "Paul" });

    });
  });

  test.case("update - multiple records", async assert => {
    await bootstrap(async () => {
      const n_updated = await User.update({ age: 40 }, { age: 45 });

      assert(n_updated).equals(2);

      const updated = await User.find({ age: 45 });
      assert(updated.length).equals(2);
    });
  });

  test.case("update - criteria and changes share a column", async assert => {
    await bootstrap(async () => {
      // Donald has age 30; update age using criteria on the same column
      const n = await User.update({ age: 30 }, { age: 31 });
      assert(n).equals(1);

      assert(await User.count({ age: 30 })).equals(0);
      assert(await User.count({ age: 31 })).equals(1);

      const [donald] = await User.find({ name: "Donald" });
      assert(donald.age).equals(31);
    });
  });

  test.case("security - update: reject missing criteria", async assert => {
    await bootstrap(async () => {
      let error: unknown;
      try {
        // should be rejected; otherwise updates all rows
        await User.update({} as any, { age: 99 });
      } catch (e) { error = e; }
      const msg = error instanceof Error ? error.message : String(error);
      assert(!!error).true();
      assert(msg.includes("update: no criteria")).true();
    });
  });

  test.case("delete - single record", async assert => {
    await bootstrap(async () => {
      const [donald] = await User.find({ name: "Donald" });
      await User.delete(donald.id);

      const deleted = await User.find({ name: "Donald" });
      assert(deleted.length).equals(0);
    });
  });

  test.case("delete - multiple records", async assert => {
    await bootstrap(async () => {
      const n = await User.delete({ age: 40 });
      assert(n).equals(2);

      const remaining = await User.find({}, { sort: { age: "asc" } });
      assert(remaining.length).equals(3);
      assert(remaining[0].name).equals("Just Jeremy");
    });
  });

  test.case("count", async assert => {
    await bootstrap(async () => {
      assert(await User.count()).equals(5);
      assert(await User.count({ name: "Ryan" })).equals(1);
      assert(await User.count({ age: 40 })).equals(2);
      assert(await User.count({ age: 30 })).equals(1);
      assert(await User.count({ age: 35 })).equals(0);
    });
  });

  test.case("has", async assert => {
    await bootstrap(async () => {
      const [donald] = await User.find({ name: "Donald" });

      assert(await User.has(donald.id)).true();
      await User.delete(donald.id);
      assert(await User.has(donald.id)).false();
    });
  });

  test.case("type - boolean", async assert => {
    await typestrap(async () => {
      const t = await Type.insert({ boolean: true });
      assert(t.boolean).equals(true);
      assert((await Type.get(t.id)).boolean).equals(true);

      await Type.update(t.id, { boolean: false });
      assert((await Type.get(t.id)).boolean).equals(false);
    });
  });

  test.case("type - string", async assert => {
    await typestrap(async () => {
      const t = await Type.insert({ string: "foo" });
      assert(t.string).equals("foo");
      assert((await Type.get(t.id)).string).equals("foo");

      await Type.update(t.id, { string: "bar" });
      assert((await Type.get(t.id)).string).equals("bar");
    });
  });

  test.case("type - date", async assert => {
    await typestrap(async () => {
      const now = new Date();
      const t = await Type.insert({ date: now });
      assert(t.date).equals(now);
      assert((await Type.get(t.id)).date).equals(now);

      const next = new Date();

      await Type.update(t.id, { date: next });
      assert((await Type.get(t.id)).date).equals(next);
    });
  });

  test.case("type - f32", async assert => {
    await typestrap(async () => {
      const t = await Type.insert({ f32: 1.5 });
      assert(t.f32).equals(1.5);
      assert((await Type.get(t.id)).f32).equals(1.5);

      await Type.update(t.id, { f32: 123456.75 });
      assert((await Type.get(t.id)).f32).equals(123456.75);
    });
  });

  test.case("type - f64", async assert => {
    await typestrap(async () => {
      const f1 = 123456.78901;
      const t = await Type.insert({ f64: f1 });
      assert(t.f64).equals(f1);
      assert((await Type.get(t.id)).f64).equals(f1);

      await Type.update(t.id, { f32: 1.5 });
      assert((await Type.get(t.id)).f32).equals(1.5);
    });
  });

  [8, 16, 32].forEach(n => {
    test.case(`type - l${n}`, async assert => {
      await typestrap(async () => {
        const key = `i${n}`;

        // lower bound
        const lb = -(2 ** (n - 1));
        const t = await Type.insert({ [key]: lb });
        assert(t[any(key)]).equals(lb);
        assert((await Type.get(t.id))[any(key)]).equals(lb);

        // upper bound
        const ub = 2 ** (n - 1) - 1;
        await Type.update(t.id, { [key]: ub });
        assert((await Type.get(t.id))[any(key)]).equals(ub);
      });
    });

    test.case(`type - u${n}`, async assert => {
      await typestrap(async () => {
        const key = `u${n}`;

        // lower bound
        const lb = 0;
        const t = await Type.insert({ [key]: lb });
        assert(t[any(key)]).equals(lb);
        assert((await Type.get(t.id))[any(key)]).equals(lb);

        // upper bound
        const ub = 2 ** n - 1;
        await Type.update(t.id, { [key]: ub });
        assert((await Type.get(t.id))[any(key)]).equals(ub);
      });
    });
  });

  [64n, 128n].forEach(i => {
    test.case(`type - i${i}`, async assert => {
      await typestrap(async () => {
        const key = `i${i}`;

        // lower bound
        const lb = -(2n ** (i - 1n));
        const t = await Type.insert({ [key]: lb });
        assert(t[any(key)]).equals(lb);
        assert((await Type.get(t.id))[any(key)]).equals(lb);

        // upper bound
        const ub = 2n ** (i - 1n) - 1n;
        const tu = await Type.insert({ [key]: ub });
        assert(tu[any(key)]).equals(ub);
        assert((await Type.get(tu.id))[any(key)]).equals(ub);
      });
    });

    test.case(`type - u${i}`, async assert => {
      await typestrap(async () => {
        const key = `u${i}`;

        // lower bound
        const lb = 0n;
        const t = await Type.insert({ [key]: lb });
        assert(t[any(key)]).equals(lb);
        assert((await Type.get(t.id))[any(key)]).equals(lb);

        // upper bound
        const ub = 2n ** i - 1n;
        const tu = await Type.insert({ [key]: ub });
        assert(tu[any(key)]).equals(ub);
        assert((await Type.get(tu.id))[any(key)]).equals(ub);
      });
    });
  });

  test.case("security - find: reject unknown criteria column", async assert => {
    await bootstrap(async () => {
      let threw = false;
      try {
        await User.find({ nope: "x" } as any);
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - find: reject empty select", async assert => {
    await bootstrap(async () => {
      let threw = false;
      try {
        await User.find({}, { select: {} as any });
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - find: reject unknown select column", async assert => {
    await bootstrap(async () => {
      let threw = false;
      try {
        await User.find({}, { select: { nope: true } as any });
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - find: reject empty sort", async assert => {
    await bootstrap(async () => {
      let threw = false;
      try {
        await User.find({}, { sort: {} as any });
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - find: reject unknown sort column", async assert => {
    await bootstrap(async () => {
      let threw = false;
      try {
        await User.find({}, { sort: { nope: "asc" } as any });
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - find: projection limits fields", async assert => {
    await bootstrap(async () => {
      const records = await User.find({}, { select: { id: true, name: true } });
      assert(records.length).equals(5);
      for (const r of records) {
        // only id + name must be present
        assert(Object.keys(r).toSorted()).equals(["id", "name"].toSorted());
      }
    });
  });

  test.case("security - update: reject unknown change column", async assert => {
    await bootstrap(async () => {
      const [donald] = await User.find({ name: "Donald" });
      let threw = false;
      try {
        await User.update(donald.id, { nope: 1 } as any);
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - update: reject empty changes object", async assert => {
    await bootstrap(async () => {
      const [donald] = await User.find({ name: "Donald" });
      let threw = false;
      try {
        await User.update(donald.id, {} as any);
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - delete: reject missing criteria", async assert => {
    await bootstrap(async () => {
      let threw = false;
      try {
        await User.delete({} as any);
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - inject invalid identifier (criteria)", async assert => {
    await bootstrap(async () => {
      let threw = false;
      try {
        // attempted injection via bogus key
        await User.find({ "name; DROP TABLE user;": "x" } as any);
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - inject invalid identifier (select)", async assert => {
    await bootstrap(async () => {
      let threw = false;
      try {
        const options = { select: { "name; DROP TABLE user;": true } as any };
        await User.find({}, options);
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - update respects unset rules and binding map", async assert => {
    await bootstrap(async () => {
      const [paul] = await User.find({ name: "Paul" });
      // allowed, lastname is optional
      await User.update(paul.id, { lastname: null });
      const [after] = await User.find({ id: paul.id }, {
        select: { id: true, name: true, lastname: true },
      });
      assert(after.lastname).undefined();
    });
  });

  test.case("security - count: reject unknown criteria column", async assert => {
    await bootstrap(async () => {
      let threw = false;
      try {
        await User.count({ nope: 1 } as any);
      } catch { threw = true; }
      assert(threw).true();
    });
  });

  test.case("security - sort: reject invalid direction", async assert => {
    await bootstrap(async () => {
      let error: unknown;
      try {
        // intentionally wrong: should be "asc" | "desc"
        await User.find({}, { sort: { age: "ascending" as any } });
      } catch (e) { error = e; }
      // we expect our own validation error, not a SQLite syntax error
      const message = error instanceof Error ? error.message : String(error);
      assert(!!error).true();
      assert(message.includes("invalid sort direction")).true();
    });
  });

  test.case("security - sort: reject undefined direction", async assert => {
    await bootstrap(async () => {
      let error: unknown;
      try {
        await User.find({}, { sort: { age: undefined as any } });
      } catch (e) { error = e; }
      const message = error instanceof Error ? error.message : String(error);
      assert(!!error).true();
      assert(message.includes("invalid sort direction")).true();
    });
  });

  test.case("quote safety - reserved table & column names", async assert => {
    // this stresses identifier quoting in CREATE/INSERT/SELECT/UPDATE/DELETE
    const Reserved = new Store({
      id: primary,
      // deliberately reserved-looking column name
      order: u8.optional(),
      name: string,
    }, { database, name: "select" }); // deliberately reserved-looking table name

    await Reserved.schema.create();

    const a = await Reserved.insert({ name: "alpha", order: 1 });
    const b = await Reserved.insert({ name: "beta", order: 2 });

    const got = await Reserved.find({ name: "alpha" });
    assert(got.length).equals(1);
    assert(got[0]).equals({ id: a.id, name: "alpha", order: 1 });

    // update using the reserved column
    const n = await Reserved.update({ name: "beta" }, { order: 9 });
    assert(n).equals(1);

    const [after] = await Reserved.find({ id: b.id });
    assert(after.order).equals(9);

    // and delete to complete the cycle
    const d = await Reserved.delete({ id: a.id });
    assert(d).equals(1);

    await Reserved.schema.delete();
  });
};
