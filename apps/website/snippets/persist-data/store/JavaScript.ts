import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";

export default store({
  id: key.primary(p.u32),
  value: p.i8.range(-20, 20),
});
