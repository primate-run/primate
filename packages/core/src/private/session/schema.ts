import InMemoryDatabase from "#database/InMemoryDatabase";
import Store from "#database/Store";
import p from "pema";

export default p({
  cookie: {
    httpOnly: p.boolean.default(true),
    name: p.string.default("session_id"),
    path: p.string.startsWith("/").default("/"),
    sameSite: p.union("Strict", "Lax", "None").default("Lax"),
  },
  store: p.constructor(Store).default(() => new Store({
    id: p.primary,
    session_id: p.string.uuid(),
  }, { database: new InMemoryDatabase(), name: "session" })),
});
