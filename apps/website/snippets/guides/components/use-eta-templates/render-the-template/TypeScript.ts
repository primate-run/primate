// routes/index.ts
import route from "primate/route";
import response from "primate/response";

route.get(() => response.view("Welcome.eta", { name: "World" }));