import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Submit.vue"));
route.post(() => null);
