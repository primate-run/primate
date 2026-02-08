import p from "pema";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  id: key.primary(p.u32),
  session_id: p.string.uuid(),
  foo: p.string,
});
