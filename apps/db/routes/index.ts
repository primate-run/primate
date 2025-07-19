import User from "#store/User";
import route from "primate/route";

export default route({
  async get() {
    //await User.schema.delete();
    await User.schema.create();

    const donald = await User.insert({
      name: "Donald",
    });
    console.log(donald);

    const r = await User.find({ name: "Donald" });//, { id: true });
    console.log(r);

    return r;
  },
});
