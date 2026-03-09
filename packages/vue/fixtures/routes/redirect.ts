import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Redirect.vue"));
route.post(() => response.redirect("/redirected"));
