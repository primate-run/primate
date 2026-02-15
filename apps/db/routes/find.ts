import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.collection.delete();
  await User.collection.create();

  await User.insert({ age: 30, name: "Donald" });

  return User.find({
    where: { age: 30 },
    select: ["age", "name"],
  });
});
