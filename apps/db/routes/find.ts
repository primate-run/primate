import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    await User.schema.create();

    await User.insert({ name: "Donald", age: 30 });

    return await User.find({ age: 30 }, {
      select: { name: true, age: true },
      limit: 1,
    });
  },
});
