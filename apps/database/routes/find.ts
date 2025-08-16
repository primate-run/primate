import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.schema.create();

  return await User.find({ age: 30 }, {
    select: { name: true, age: true },
  });
});
