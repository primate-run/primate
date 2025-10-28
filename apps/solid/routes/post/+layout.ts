import Layout from "#view/Layout";
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view(Layout, {}));
