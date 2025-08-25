import InMemorySessionManager from "#session/InMemoryManager";
import SessionManager from "#session/Manager";
import pema from "pema";
import boolean from "pema/boolean";
import constructor from "pema/constructor";
import string from "pema/string";
import union from "pema/union";

export default pema({
  cookie: {
    httpOnly: boolean.default(true),
    name: string.default("session_id"),
    path: string.startsWith("/").default("/"),
    sameSite: union("Strict", "Lax", "None").default("Lax"),
  },
  manager: constructor(SessionManager)
    .default(() => new InMemorySessionManager()),
});
