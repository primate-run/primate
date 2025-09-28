// routes/index.ts
import route from "primate/route";

route.get((request) => {
  const userAgent = request.headers.get("User-Agent");
  const contentType = request.headers.get("Content-Type");
  return { userAgent, contentType };
});
