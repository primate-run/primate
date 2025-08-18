import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.schema.delete();
  await User.schema.create();

  const donald = await User.insert({ age: 30, name: "Donald" });

  const exists = await User.exists(donald.id!);

  return { exists };
});
