import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    await User.table.delete();
    await User.table.create();

    return { count: await User.count() };
  },
});
