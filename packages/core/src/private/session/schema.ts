import InMemoryDB from "#db/InMemoryDB";
import key from "#orm/key";
import Store from "#orm/Store";
import p from "pema";

export default p({
  cookie: {
    httpOnly: p.boolean.default(true),
    name: p.string.default("session_id"),
    path: p.string.startsWith("/").default("/"),
    sameSite: p.union("Strict", "Lax", "None").default("Lax"),
  },
  store: p.constructor(Store).default(() => {
    return new Store({
      id: key.primary(p.string),
      session_id: p.string.uuid(),
    }, { db: new InMemoryDB(), name: "session" }) as Store<any>;
  }),
});
