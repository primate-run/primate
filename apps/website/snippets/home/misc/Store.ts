import date from "pema/date";
import primary from "pema/primary";
import string from "pema/string";
import store from "primate/store";

export default store({
  id: primary,
  title: string.max(50),
  body: string,
  created: date.default(() => new Date()),
});
