import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    await User.insert({ age: 30, name: "Donald" });

    return User.find({ where: { age: 30 }, select: ["age", "name"] });
  },
});
