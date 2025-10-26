import FileSessionManager from "#config/FileSessionManager";
import p from "pema";
import session from "primate/config/session";

export default session({
  schema: p({ foo: p.string }),
  manager: new FileSessionManager(),
});
