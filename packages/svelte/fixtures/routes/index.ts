import response from "primate/response";
import route from "primate/route";
import Index from "#view/Index";

route.get(() => response.view(Index));
