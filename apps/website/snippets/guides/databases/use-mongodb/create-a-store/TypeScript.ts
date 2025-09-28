import primary from "pema/primary";
import string from "pema/string";
import store from "primate/store";

export default store({
  id: primary,
  name: string,
  email: string.email(),
});
