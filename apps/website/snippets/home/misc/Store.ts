import p from "pema";
import key from "primate/orm/key";
import store from "primate/orm/store";
import db from "../config/db/index.ts";

export default store({
  name: "post",
  db,
  schema: {
    id: key.primary(p.u32),
    title: p.string.max(50),
    body: p.string,
    created: p.date.default(() => new Date()),
  }
});
