import MemoryDB from "#db/MemoryDB";
import store from "#store";
import Store from "#store/Store";
import key from "#store/key";
import p from "pema";

export default p({
  cookie: {
    httpOnly: p.boolean.default(true),
    name: p.string.default("session_id"),
    path: p.string.startsWith("/").default("/"),
    sameSite: p.union("Strict", "Lax", "None").default("Lax"),
  },
  store: p.constructor(Store).default(() => {
    return store({
      schema: {
        id: key.primary(p.uuid),
        session_id: p.uuid,
      },
      db: new MemoryDB(),
      table: "session",
    }) as Store<any>;
  }),
});
