import pema from "pema";
import string from "pema/string";
import session from "primate/config/session";
import FileSessionManager from "#config/FileSessionManager";

export default session({
  schema: pema({ foo: string }),
  manager: new FileSessionManager(),
});
