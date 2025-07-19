import string from "pema/string";
import store from "primate/store";
import primary from "pema/primary";

export const getMe = () => undefined;

export default store({
  id: primary,
  name: string,
  lastname: string.optional(),
});
