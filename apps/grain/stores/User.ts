import store from "primate/store";
import p from "pema";

export default store({
  id: p.primary,
  name: p.string,
  age: p.u8.range(0, 120),
  lastname: p.string.optional(),
});
