import db from "#db";
import p from "pema";
import store from "primate/store";

export default store({
  table: "user",
  db,
  schema: {
    id: store.key.primary(p.u32),
    name: p.string,
    age: p.u8.range(0, 120),
    lastname: p.string.optional(),
  },
});
