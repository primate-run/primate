import APIStore from "#store/APIStore";
import route from "primate/route";

export default route({
  async get() {
    const data = await APIStore.find();
    return data;
  },
});
