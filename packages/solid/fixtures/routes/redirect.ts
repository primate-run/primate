import Redirect from "#view/Redirect";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view(Redirect));
route.post(() => response.redirect("/redirected"));
