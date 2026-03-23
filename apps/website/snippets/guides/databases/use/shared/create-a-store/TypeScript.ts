import p from "pema";
import key from "primate/orm/key";
import store from "primate/orm/store";
import db from "../config/db/index.ts";

export default store({
  name: "user",
  db,
  schema: {
    id: key.primary(p.uuid),
    name: p.string,
    email: p.string.email(),
  },
});
