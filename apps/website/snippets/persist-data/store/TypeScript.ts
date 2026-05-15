import p from "pema";
import store from "primate/store";
import db from "../config/db.ts";

export default store({
  table: "counter",
  db,
  schema: {
    id: store.key.primary(p.u32),
    value: p.i8.range(-20, 20),
  }
});
