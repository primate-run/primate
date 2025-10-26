import Status from "primate/http/Status";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.redirect("/redirected", Status.MOVED_PERMANENTLY));
