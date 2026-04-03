import db from "#db";
import p from "pema";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  name: "user",
  db,
  schema: {
    id: key.primary(p.u32),
    name: p.string,
    age2: p.u8.range(0, 120),
    lastname: p.string.optional(),
  },
});
