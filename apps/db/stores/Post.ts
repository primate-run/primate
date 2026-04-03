import db from "#db";
import p from "pema";
import key from "primate/orm/key";
import store from "primate/orm/store";

export default store({
  name: "post",
  db,
  schema: {
    id: key.primary(p.u32),
    title: p.string,
    body: p.string,
    created: p.date.default(() => new Date()),
  },
});
