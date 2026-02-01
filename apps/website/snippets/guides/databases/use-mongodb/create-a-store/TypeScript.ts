import p from "pema";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  id: key.primary(p.string),
  name: p.string,
  email: p.string.email(),
});
