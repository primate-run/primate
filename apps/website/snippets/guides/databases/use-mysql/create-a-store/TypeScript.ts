// stores/User.ts
import store from "primate/store";
import primary from "pema/primary";
import string from "pema/string";

export default store({
  id: primary,
  name: string,
  email: string,
});