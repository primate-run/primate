import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    const users = await User.find({});
    return users;
  },
  async post(request) {
    const user = await User.insert(await request.body.form());
    return user;
  },
});
