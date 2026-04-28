import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    const { id: _id, ...donald } = await User.insert({
      age: 30,
      name: "Donald",
    });

    return donald;
  },
});
