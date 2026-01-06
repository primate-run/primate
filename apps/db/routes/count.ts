import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.collection.delete();
  await User.collection.create();

  await User.insert({ age: 30, name: "Donald" });
  await User.insert({ age: 40, name: "Ryan" });

  const count = await User.count();

  return { count };
});
