import p from "pema";
import memorydb from "primate/memorydb";
import store from "primate/store";

export default store({
  table: "counter",
  db: memorydb(),
  schema: {
    id: store.key.primary(p.u32),
    counter: p.i8.range(-20, 20),
  },
});
