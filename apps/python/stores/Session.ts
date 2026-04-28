import p from "pema";
import memorydb from "primate/memorydb";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  table: "session",
  db: memorydb(),
  schema: {
    id: key.primary(p.u32),
    session_id: p.uuid,
    foo: p.string,
  },
});
