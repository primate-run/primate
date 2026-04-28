import p from "pema";
import store from "primate/store";
import db from "../config/db/index.ts";

export default store({
  name: "user",
  db,
  schema: {
    id: store.key.primary(p.uuid),
    name: p.string,
    email: p.string.email(),
  },
});
