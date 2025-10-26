import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("Layout.component.ts",
  { user: { name: "John" } }));
