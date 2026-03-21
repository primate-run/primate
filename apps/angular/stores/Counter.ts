import p from "pema";
import db from "primate/db";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  name: "counter",
  db: db(),
  schema: {
    id: key.primary(p.u32),
    counter: p.i8.range(-20, 20),
  },
});
