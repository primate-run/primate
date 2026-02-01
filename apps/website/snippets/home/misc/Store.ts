import p from "pema";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  id: key.primary(p.u32),
  title: p.string.max(50),
  body: p.string,
  created: p.date.default(() => new Date()),
});
