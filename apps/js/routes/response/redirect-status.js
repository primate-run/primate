import Status from "primate/response/Status";
import redirect from "primate/response/redirect";
import route from "primate/route";

route.get(() => redirect("/redirected", Status.MOVED_PERMANENTLY));
