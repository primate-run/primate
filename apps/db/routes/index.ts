import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    return { count: await User.count() };
  },
});
