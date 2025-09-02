import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.schema.delete();
  await User.schema.create();

  const { id } = await User.insert({ age: 30, name: "Donald" });

  await User.delete(id);

  return "deleted";
});
