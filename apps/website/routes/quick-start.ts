import redirect from "primate/response/redirect";
import route from "primate/route";

route.get(() => redirect("/guide/getting-started#quick-start"));
