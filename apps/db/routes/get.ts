import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.table.delete();
  await User.table.create();

  const { id } = await User.insert({ age: 30, name: "Donald" });

  const { id: _id, ...donald } = await User.get(id);

  return donald;
});
