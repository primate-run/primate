import Submit from "#view/Submit";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view(Submit));
route.post(() => null);
