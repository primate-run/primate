import Store from "#db/Store";
import test from "@rcompat/test";
import number from "pema/number";
import optional from "pema/optional";
import string from "pema/string";
import uint from "pema/uint";
import primary from "pema/primary";
import type Database from "#db/Database";
import type Dict from "@rcompat/type/Dict";

function pick<
  D extends Dict,
  P extends string[],
>(document: D, ...projection: P) {
  return Object.fromEntries(Object.entries(document)
    .filter(([key]) => projection.includes(key)));
};

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
  //   //post_id: Post.schema.id,
  //   //post: Post.one({ post_id: post => post.id }),
  //   //posts: Post.many({ id: post => post.user_id }),
  }, { name: "user", db: database });

  /*test.case("query", async assert => {
    const r = await User.query().select("lastname", "name").run();
    assert(r).type<{ name: string; lastname?: string }>();
  });*/

  test.case("insert", async assert => {
    await User.schema.create();

    const donald = await User.insert({ name: "Donald", age: 30 });
    assert(await User.exists(donald.id!)).true();

    const ryan = await User.insert({ name: "Ryan", age: 40 });
    assert(await User.exists(donald.id!)).true();
    assert(await User.exists(ryan.id!)).true();

    await User.schema.delete();
  });

  test.case("find", async assert => {
    await User.schema.create();

    const donald = { name: "Donald", age: 30 };
    const donald_duck = { name: "Donald", age: 34, lastname: "Duck" };
    const ryan = { name: "Ryan", age: 40 };
    const ryan_wilson = { name: "Ryan", age: 25, lastname: "Wilson"};
    const ben_miller = { name: "Ben", age: 60, lastname: "Miller"};

    await User.insert(donald);
    await User.insert(donald_duck);
    await User.insert(ryan);
    await User.insert(ryan_wilson);
    await User.insert(ben_miller);

    const ryans = await User.find({ name: "Ryan" });
    assert(ryans).type<{
      id?: string;
      name: string;
      lastname?: string;
      age: number;
    }[]>();
    assert(ryans.length).equals(2);
    assert(ryans[0]).equals({ id: ryans[0].id, ...ryan });
    assert(ryans[1]).equals({ id: ryans[1].id, ...ryan_wilson });

    const no_one = await User.find({ name: "No One" });
    assert(no_one.length).equals(0);
    const no_one_name = await User.find({ name: "No One" },
      { select: { name: true } });
    assert(no_one_name.length).equals(0);

    const donalds = await User.find({ name: "Donald" },
      { select: { name: true, lastname: true } });
    assert(donalds).type<{
      name: string;
      lastname?: string;
    }[]>();
    assert(donalds.length).equals(2);
    assert(donalds[0]).equals(pick(donald, "name", "lastname"));
    assert(donalds[1]).equals(pick(donald_duck, "name", "lastname"));

    const sorted_donalds = await User.find({ name: "Donald" },
      { sort: { age: "desc" }});
    assert(sorted_donalds.length).equals(2);
    assert(sorted_donalds[0]).equals(pick(donald_duck, "name", "lastname"));
    assert(sorted_donalds[1]).equals(pick(donald, "name", "lastname"));

    /*const users2 = await User.find({ name: "string" }, { age: true });
    assert(users2).type<{
      age: number;
    }[]>();

    const users3 = await User.find({ name: "string" }, {
      age: true, lastname: true,
    });
    assert(users3).type<{
      age: number;
      lastname?: string;
    }[]>();*/

    await User.schema.delete();
  });
};
