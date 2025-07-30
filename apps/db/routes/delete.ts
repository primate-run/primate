import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.schema.create();

  const { id } = await User.insert({ name: "Donald", age: 30 });

  await User.delete(id!);

  return "deleted";
});
