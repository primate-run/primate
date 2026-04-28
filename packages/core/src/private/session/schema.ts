import MemoryDB from "#db/MemoryDB";
import key from "#orm/key";
import store, { Store } from "#orm/store";
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
