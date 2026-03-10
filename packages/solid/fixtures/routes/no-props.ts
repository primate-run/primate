import response from "primate/response";
import route from "primate/route";
import Request from "#view/Request";

route.get(() => response.view(Request));
