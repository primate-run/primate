import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    await User.schema.create();

    const { id: _id, ...donald } = await User.insert({
      name: "Donald",
      age: 30,
    });

    return donald;
  },
});
