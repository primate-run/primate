import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Redirect.component.ts"));
route.post(() => response.redirect("/redirected"));
