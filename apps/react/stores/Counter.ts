import i8 from "pema/i8";
import primary from "pema/primary";
import store from "primate/store";

export default store({
  counter: i8.range(-20, 20),
  id: primary,
});
