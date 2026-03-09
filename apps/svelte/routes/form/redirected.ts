import RedirectedFromForm from "#view/RedirectedFromForm";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view(RedirectedFromForm));
