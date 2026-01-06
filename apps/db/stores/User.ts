import p from "pema";
import store from "primate/store";

export default store({
  id: p.primary,
  name: p.string,
  age: p.u8.range(0, 120),
  lastname: p.string.optional(),
});
