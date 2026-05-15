import p from "pema";
import store from "primate/store";
import db from "../config/db.ts";

export default store({
  table: "user",
  db,
  schema: {
    id: store.key.primary(p.uuid),
    name: p.string,
    email: p.string.email(),
  },
});
