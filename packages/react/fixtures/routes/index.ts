import response from "primate/response";
import Index from "#view/Index";
import route from "primate/route";

route.get(() => response.view(Index));
