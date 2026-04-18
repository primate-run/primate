import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    await User.table.delete();
    await User.table.create();

    const { id } = await User.insert({ age: 30, name: "Donald" });

    await User.delete(id);

    return "deleted";
  },
});
