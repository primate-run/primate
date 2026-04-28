import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    const { id } = await User.insert({ age: 30, name: "Donald" });

    await User.update(id, { set: { age: 35 } });

    const { id: _id, ...updated } = await User.get(id);

    return updated;
  },
});
