import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.collection.delete();
  await User.collection.create();

  return { count: await User.count() };
});
