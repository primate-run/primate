import p from "pema";
import store from "primate/orm/store";

export default store({
  id: p.primary,
  session_id: p.string.uuid(),
  foo: p.string,
});
