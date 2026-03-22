import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.table.delete();
  await User.table.create();

  const donald = await User.insert({ age: 30, name: "Donald" });

  const has = await User.has(donald.id);

  return { has };
});
