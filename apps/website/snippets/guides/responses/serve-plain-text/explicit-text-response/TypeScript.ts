import response from "primate/response";
import route from "primate/route";

route.get(() => response.text("Not found", { status: 404 }));
