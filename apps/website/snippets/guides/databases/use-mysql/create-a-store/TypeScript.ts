import p from "pema";
import store from "primate/store";

export default store({
  id: p.primary,
  name: p.string,
  email: p.string,
});
