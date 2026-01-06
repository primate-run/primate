import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.collection.delete();
  await User.collection.create();

  const { id: _id, ...donald } = await User.insert({
    age: 30,
    name: "Donald",
  });

  return donald;
});
