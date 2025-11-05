import session from "primate/config/session";
import DefaultDatabase from "primate/database/default";
import p from "primate/pema";
import store from "primate/store";

export default session({
  store: store({
    session_id: p.string.uuid(),
  }, {
    database: new DefaultDatabase(),
    name: "session",
  }),
});
