import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    await User.schema.create();

    const donald = await User.insert({ name: "Donald", age: 30 });

    const exists = await User.exists(donald.id!);

    return { exists };
  },
});
