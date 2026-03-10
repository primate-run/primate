import Pathname from "#view/Pathname";
import response from "primate/response";
import route from "primate/route";

route.get(request => response.view(Pathname));
