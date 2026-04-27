// routes/+error.ts
import route from "primate/route";

export default route({
  get() {
    return response.json({ error: "Internal error" }, { status: 500 });
  },
});
