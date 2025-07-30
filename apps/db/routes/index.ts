import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.schema.delete();
  await User.schema.create();

  return { count: await User.count() };
});
