import Props from "#view/Props";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view(Props, { foo: "bar" }));
