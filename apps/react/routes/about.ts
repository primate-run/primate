import About from "#view/About";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view(About));
