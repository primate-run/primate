import response from "primate/response";
import route from "primate/route";

route.get(() => response.json({ error: "Not found" }, { status: 404 }));
