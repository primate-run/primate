import InMemorySessionManager from "#session/InMemoryManager";
import SessionManager from "#session/Manager";
import pema from "pema";
import boolean from "pema/boolean";
import constructor from "pema/constructor";
import string from "pema/string";
import union from "pema/union";

export default pema({
  manager: constructor(SessionManager)
    .default(() => new InMemorySessionManager()),
  cookie: {
    name: string.default("session_id"),
    same_site: union("Strict", "Lax", "None").default("Lax"),
    http_only: boolean.default(true),
    path: string.startsWith("/").default("/"),
  },
});
