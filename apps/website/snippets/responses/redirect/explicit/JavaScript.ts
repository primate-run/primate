import Status from "@rcompat/http/Status";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.redirect("https://primate.run", Status.SEE_OTHER));

route.post(request => response.redirect(`/login?next=${request.target}`));
