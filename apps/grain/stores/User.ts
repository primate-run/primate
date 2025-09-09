import primary from "pema/primary";
import string from "pema/string";
import u8 from "pema/u8";
import store from "primate/store";

export default store({
  id: primary,
  name: string,
  age: u8.range(0, 120),
  lastname: string.optional(),
});
