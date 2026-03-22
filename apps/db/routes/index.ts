import User from "#store/User";
import route from "primate/route";

route.get(async () => {
  await User.table.delete();
  await User.table.create();

  return { count: await User.count() };
});
