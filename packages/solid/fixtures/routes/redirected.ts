import response from "primate/response";
import route from "primate/route";
import Redirected from "#view/Redirected";

route.get(() => response.view(Redirected));
