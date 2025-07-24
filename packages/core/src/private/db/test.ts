import type Database from "#db/Database";
import Store from "#db/Store";
import test from "@rcompat/test";
import any from "@rcompat/test/any";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
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
  donald: { name: "Donald", age: 30, lastname: "Duck" },
  ryan: { name: "Ryan", age: 40, lastname: "Wilson" },
  ben: { name: "Ben", age: 60, lastname: "Miller" },
  jeremy: { name: "Just Jeremy", age: 20 },
  paul: { name: "Paul", age: 40, lastname: "Miller" },
} as const;
type User = keyof typeof users;

export default <D extends Database>(db: D, end?: () => MaybePromise<void>) => {
  if (end !== undefined) {
    test.ended(end);
  }

  const _Post = new Store({
    id: primary,
    title: string,
    user_id: uint,
  }, { name: "post", db });

  const User = new Store({
    id: primary,
    name: string.default("Donald"),
    lastname: optional(string),
    age: u8,
  }, { name: "user", db });

  const Type = new Store({
    id: primary,
    boolean: boolean.optional(),
    date: date.optional(),
    f32: f32.optional(),
    f64: f64.optional(),
    i8: i8.optional(),
    i16: i16.optional(),
    i32: i32.optional(),
    i64: i64.optional(),
    i128: i128.optional(),
    string: string.optional(),
    u8: u8.optional(),
    u16: u16.optional(),
    u32: u32.optional(),
    u64: u64.optional(),
    u128: u128.optional(),
  }, { name: "type", db });

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

    const donald = await User.insert({ name: "Donald", age: 30 });
    assert(await User.exists(donald.id!)).true();

    const ryan = await User.insert({ name: "Ryan", age: 40 });
    assert(await User.exists(donald.id!)).true();
    assert(await User.exists(ryan.id!)).true();

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
      // Sorting by multiple fields: age descending, then Lastname ascending
      const sorted = await User.find({}, {
        sort: { age: "desc", lastname: "asc" },
        select: { name: true, age: true },
      });

      assert(sorted.length).equals(5);
      ["ben", "paul", "ryan", "donald", "jeremy"].forEach((user, i) => {
        assert(sorted[i]).equals(pick(users[user as User], "name", "age"));
      });
    });
  });

  test.case("find - sorting ascending and descending", async assert => {
    await bootstrap(async () => {
      const ascending = await User.find({}, {
        sort: { age: "asc" },
        select: { name: true, age: true },
      });

      const ascended = ["jeremy", "donald", "ryan", "paul", "ben"];
      ascended.forEach((user, i) => {
        assert(ascending[i]).equals(pick(users[user as User], "name", "age"));
      });

      const descending = await User.find({}, {
        sort: { age: "desc" },
        select: { name: true, age: true },
      });

      // NB: Since Ryan and Paul have the same age, they will be returned in
      // order of insertion; can't use `ascended.toReversed()`
      const descended = ["ben", "ryan", "paul", "donald", "jeremy"];
      descended.forEach((user, i) => {
        assert(descending[i]).equals(pick(users[user as User], "name", "age"));
      });
    });
  });

  test.case("find - limiting", async assert => {
    await bootstrap(async () => {
      const ascending = await User.find({}, {
        sort: { age: "asc" },
        select: { name: true, age: true },
        limit: 3,
      });

      assert(ascending.length).equals(3);
      const ascended = ["jeremy", "donald", "ryan"];
      ascended.forEach((user, i) => {
        assert(ascending[i]).equals(pick(users[user as User], "name", "age"));
      });
    });
  });

  test.case("update - single record", async assert => {
    await bootstrap(async () => {
      const [donald] = (await User.find({ name: "Donald" }));

      await User.update(donald.id!, { age: 35 });

      const [updated] = (await User.find({ name: "Donald" }));
      assert(updated.age).equals(35);
      assert(updated).equals({ ...users.donald, id: donald.id!, age: 35 });
    });
  });

  test.case("update - unset fields", async assert => {
    await bootstrap(async () => {
      const [donald] = (await User.find({ name: "Donald" }));

      assert(donald.age).equals(30);
      await User.update(donald.id!, { age: null });

      const [updated] = (await User.find({ name: "Donald" }));
      assert(updated.age).undefined();

      const [paul] = (await User.find({ name: "Paul" }));
      await User.update(paul.id!, { age: null, lastname: null });

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

  test.case("delete - single record", async assert => {
    await bootstrap(async () => {
      const [donald] = await User.find({ name: "Donald" });
      await User.delete(donald.id!);

      const deleted = await User.find({ name: "Donald" });
      assert(deleted.length).equals(0);
    });
  });

  test.case("delete - multiple records", async assert => {
    await bootstrap(async () => {
      const n = await User.delete({ age: 40 });
      assert(n).equals(2);

      const remaining = await User.find({});
      assert(remaining.length).equals(3);
      assert(remaining[0].name).equals("Donald");
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

  test.case("exists", async assert => {
    await bootstrap(async () => {
      const [donald] = await User.find({ name: "Donald" });

      assert(await User.exists(donald.id!)).true();
      assert(await User.exists("1234")).false();
    });
  });

  test.case("type - boolean", async assert => {
    await typestrap(async () => {
      const t = await Type.insert({ boolean: true });
      assert(t.boolean).equals(true);
      assert((await Type.get(t.id!)).boolean).equals(true);

      await Type.update(t.id!, { boolean: false });
      assert((await Type.get(t.id!)).boolean).equals(false);
    });
  });

  test.case("type - string", async assert => {
    await typestrap(async () => {
      const t = await Type.insert({ string: "foo" });
      assert(t.string).equals("foo");
      assert((await Type.get(t.id!)).string).equals("foo");

      await Type.update(t.id!, { string: "bar" });
      assert((await Type.get(t.id!)).string).equals("bar");
    });
  });

  test.case("type - date", async assert => {
    await typestrap(async () => {
      const now = new Date();
      const t = await Type.insert({ date: now });
      assert(t.date).equals(now);
      assert((await Type.get(t.id!)).date).equals(now);

      const next = new Date();

      await Type.update(t.id!, { date: next });
      assert((await Type.get(t.id!)).date).equals(next);
    });
  });

  test.case("type - f32", async assert => {
    await typestrap(async () => {
      const t = await Type.insert({ f32: 1.5 });
      assert(t.f32).equals(1.5);
      assert((await Type.get(t.id!)).f32).equals(1.5);

      await Type.update(t.id!, { f32: 123456.75 });
      assert((await Type.get(t.id!)).f32).equals(123456.75);
    });
  });

  test.case("type - f64", async assert => {
    await typestrap(async () => {
      const f1 = 123456.78901;
      const t = await Type.insert({ f64: f1 });
      assert(t.f64).equals(f1);
      assert((await Type.get(t.id!)).f64).equals(f1);

      await Type.update(t.id!, { f32: 1.5 });
      assert((await Type.get(t.id!)).f32).equals(1.5);
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
        assert((await Type.get(t.id!))[any(key)]).equals(lb);

        // upper bound
        const ub = 2 ** (n - 1) - 1;
        await Type.update(t.id!, { [key]: ub });
        assert((await Type.get(t.id!))[any(key)]).equals(ub);
      });
    });

    test.case(`type - u${n}`, async assert => {
      await typestrap(async () => {
        const key = `u${n}`;

        // lower bound
        const lb = 0;
        const t = await Type.insert({ [key]: lb });
        assert(t[any(key)]).equals(lb);
        assert((await Type.get(t.id!))[any(key)]).equals(lb);

        // upper bound
        const ub = 2 ** n - 1;
        await Type.update(t.id!, { [key]: ub });
        assert((await Type.get(t.id!))[any(key)]).equals(ub);
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
        assert((await Type.get(t.id!))[any(key)]).equals(lb);

        // upper bound
        const ub = 2n ** (i - 1n) - 1n;
        const tu = await Type.insert({ [key]: ub });
        assert(tu[any(key)]).equals(ub);
        assert((await Type.get(tu.id!))[any(key)]).equals(ub);
      });
    });

    test.case(`type - u${i}`, async assert => {
      await typestrap(async () => {
        const key = `u${i}`;

        // lower bound
        const lb = 0n;
        const t = await Type.insert({ [key]: lb });
        assert(t[any(key)]).equals(lb);
        assert((await Type.get(t.id!))[any(key)]).equals(lb);

        // upper bound
        const ub = 2n ** i - 1n;
        const tu = await Type.insert({ [key]: ub });
        assert(tu[any(key)]).equals(ub);
        assert((await Type.get(tu.id!))[any(key)]).equals(ub);
      });
    });
  });
};
