import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    await User.insert({ age: 30, name: "Donald" });
    await User.insert({ age: 40, name: "Ryan" });

    const count = await User.count();

    return { count };
  },
});
