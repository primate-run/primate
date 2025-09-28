// routes/+error.ts
import route from "primate/route";

route.get(() => response.json({ error: "Internal error" }, { status: 500 }));