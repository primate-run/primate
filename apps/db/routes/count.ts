import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.schema.create();

  await User.insert({ name: "Donald", age: 30 });
  await User.insert({ name: "Ryan", age: 40 });

  const count = await User.count();

  return { count };
});
