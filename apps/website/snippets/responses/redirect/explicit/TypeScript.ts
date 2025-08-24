import Status from "@rcompat/http/Status";
import redirect from "primate/response/redirect";
import route from "primate/route";

// another status
route.get(() => redirect("https://primate.run", Status.SEE_OTHER));

// local redirect
route.get(request => redirect(`/login?next=${request.query.toString()}`));
