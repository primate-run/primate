import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.collection.delete();
  await User.collection.create();

  const { id } = await User.insert({ age: 30, name: "Donald" });

  const { id: _id, ...donald } = (await User.try(id))!;

  return donald;
});
