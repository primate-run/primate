import p from "pema";
import store from "primate/store";

export default store({
  id: p.primary,
  value: p.i8.range(-20, 20),
});
