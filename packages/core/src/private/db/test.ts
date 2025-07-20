import type Database from "#db/Database";
import Store from "#db/Store";
import test from "@rcompat/test";
import type Dict from "@rcompat/type/Dict";
import number from "pema/number";
import optional from "pema/optional";
import primary from "pema/primary";
import string from "pema/string";
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


export default <D extends Database>(database: D) => {
  const _Post = new Store({
    id: primary,
    title: string,
    user_id: uint,
  }, { name: "post", db: database });

  const User = new Store({
    id: primary,
    name: string.default("Donald"),
    lastname: optional(string),
    age: number,
  }, { name: "user", db: database });

  const bootstrap = async (tester: () => Promise<void>) => {
    await User.schema.create();
    for (const user of Object.values(users)) {
      await User.insert(user);
    }
    await tester();
    await User.schema.delete();
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

  test.case("update - single record", async assert => {
    await bootstrap(async () => {
      const donald = { name: "Donald", age: 30 };
      const donald_id = (await User.insert(donald)).id!;

      const updated = await User.update(donald_id, { age: 35 });
      assert(updated.age).equals(35);
    });
  });

  test.case("update - multiple records", async assert => {
    await bootstrap(async () => {
      const updated = await User.update({ age: 40 }, { age: 45 });

      assert(updated.length).equals(2);
      assert(updated[0].age).equals(45);
      assert(updated[1].age).equals(45);
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
      assert(await User.exists("1fd4")).false();
    });
  });
};
