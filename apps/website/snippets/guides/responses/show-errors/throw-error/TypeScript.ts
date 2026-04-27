// routes/api.ts
import route from "primate/route";

export default route({
  get() {
    throw new Error("Something went wrong");
  },
});
