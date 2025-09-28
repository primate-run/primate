import response from "primate/response";
import route from "primate/route";

route.get(() => response("Custom text", {
  headers: { "Content-Type": "text/custom" },
}));
