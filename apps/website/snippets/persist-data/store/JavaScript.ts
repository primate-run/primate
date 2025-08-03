import i8 from "pema/i8";
import primary from "pema/primary";
import store from "primate/store";

export default store({
  id: primary,
  value: i8.range(-20, 20),
});
