import Request from "#view/Request";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view(Request));
