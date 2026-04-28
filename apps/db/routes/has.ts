import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    const donald = await User.insert({ age: 30, name: "Donald" });

    const has = await User.has(donald.id);

    return { has };
  },
});
