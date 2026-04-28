import p from "pema";
import memorydb from "primate/memorydb";
import store from "primate/store";

export default store({
  table: "session",
  db: memorydb(),
  schema: {
    id: store.key.primary(p.u32),
    session_id: p.uuid,
    foo: p.string,
  },
});
