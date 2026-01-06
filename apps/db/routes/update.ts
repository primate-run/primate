import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.collection.delete();
  await User.collection.create();

  const { id } = await User.insert({ age: 30, name: "Donald" });

  await User.update(id, { age: 35 });

  const { id: _id, ...updated } = await User.get(id);

  return updated;
});
