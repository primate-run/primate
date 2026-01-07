import p from "pema";
import store from "primate/orm/store";

export default store({
  id: p.primary,
  counter: p.i8.range(-20, 20),
});
