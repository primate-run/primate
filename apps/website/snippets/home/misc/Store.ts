import p from "pema";
import store from "primate/store";
import db from "../config/db.ts";

export default store({
  table: "post",
  db,
  schema: {
    id: store.key.primary(p.u32),
    title: p.string.max(50),
    body: p.string,
    created: p.date.default(() => new Date()),
  }
});
