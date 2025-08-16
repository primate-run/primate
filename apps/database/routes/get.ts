import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.schema.create();

  const { id } = await User.insert({ name: "Donald", age: 30 });

  const { id: _id, ...donald } = await User.get(id!);

  return donald;
});
