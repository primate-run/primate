import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Submit.component.ts"));
route.post(() => null);
