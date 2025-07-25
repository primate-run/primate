import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    await User.schema.delete();
    await User.schema.create();

    return { count: await User.count() };
  },
});
