import InMemorySessionManager from "#session/InMemoryManager";
import SessionManager from "#session/Manager";
import pema from "pema";
import boolean from "pema/boolean";
import constructor from "pema/constructor";
import string from "pema/string";
import union from "pema/union";

export default pema({
  cookie: {
    http_only: boolean.default(true),
    name: string.default("session_id"),
    path: string.startsWith("/").default("/"),
    same_site: union("Strict", "Lax", "None").default("Lax"),
  },
  manager: constructor(SessionManager)
    .default(() => new InMemorySessionManager()),
});
