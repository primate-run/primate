import response from "primate/response";
import route from "primate/route";
import Props from "#view/Props";

route.get(() => response.view(Props, { foo: "bar" }));
