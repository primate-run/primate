import p from "pema";
import memorydb from "primate/memorydb";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  table: "counter",
  db: memorydb(),
  schema: {
    id: key.primary(p.u32),
    counter: p.i8.range(-20, 20),
  },
});
