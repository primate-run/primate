import p from "pema";
import db from "primate/db";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  name: "session",
  db: db(),
  schema: {
    id: key.primary(p.u32),
    session_id: p.uuid,
    foo: p.string,
  },
});
