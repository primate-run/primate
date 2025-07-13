import Status from "primate/http/Status";
import redirect from "primate/redirect";

export default {
  get() {
    return redirect("/redirected", Status.MOVED_PERMANENTLY);
  },
};
