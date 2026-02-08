import p from "pema";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  id: key.primary(p.u32),
  counter: p.i8.range(-20, 20),
});
