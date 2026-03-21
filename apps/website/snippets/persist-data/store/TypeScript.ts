import p from "pema";
import key from "primate/orm/key";
import store from "primate/orm/store";
import db from "../config/db/index.ts";

export default store({
  name: "counter",
  db,
  schema: {
    id: key.primary(p.u32),
    value: p.i8.range(-20, 20),
  }
});
