import User from "@/stores/User";
import route from "primate/route";

export default route({
  async get() {
    return { count: await User.count() };
  },
});
