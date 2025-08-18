import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.schema.delete();
  await User.schema.create();

  await User.insert({ age: 30, name: "Donald" });

  return await User.find({ age: 30 }, {
    select: { age: true, name: true },
  });
});
