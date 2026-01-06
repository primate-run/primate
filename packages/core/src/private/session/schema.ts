import InMemoryDB from "#db/InMemoryDB";
import Store from "#db/Store";
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
      id: p.primary,
      session_id: p.string.uuid(),
    }, { db: new InMemoryDB(), name: "session" });
  }),
});
