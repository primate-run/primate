import redirect from "primate/redirect";

export default {
  get() {
    return redirect("/redirected");
  },
};
