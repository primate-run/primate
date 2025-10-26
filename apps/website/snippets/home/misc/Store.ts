import store from "primate/store";
import p from "pema";

export default store({
  id: p.primary,
  title: p.string.max(50),
  body: p.string,
  created: p.date.default(() => new Date()),
});
