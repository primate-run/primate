import string from "pema/string";
import store from "primate/store";
import primary from "pema/primary";
import u8 from "pema/u8";

export default store({
  id: primary,
  name: string,
  age: u8.range(0, 120),
  lastname: string.optional(),
});
