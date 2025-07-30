import redirect from "primate/redirect";
import route from "primate/route";

route.get(() => redirect("/redirected"));
