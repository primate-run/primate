import Status from "primate/http/Status";
import redirect from "primate/redirect";
import route from "primate/route";

route.get(() => redirect("/redirected", Status.MOVED_PERMANENTLY));
