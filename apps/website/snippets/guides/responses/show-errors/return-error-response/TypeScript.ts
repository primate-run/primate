import response from "primate/response";

route.get(() => response.json({ error: "Bad request" }, { status: 400 }));
