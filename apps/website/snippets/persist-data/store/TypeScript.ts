import p from "pema";
import store from "primate/store";
import db from "../config/db/index.ts";

export default store({
  name: "counter",
  db,
  schema: {
    id: store.key.primary(p.u32),
    value: p.i8.range(-20, 20),
  }
});
