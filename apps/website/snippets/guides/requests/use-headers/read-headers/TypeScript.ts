// routes/index.ts
import route from "primate/route";

export default route({
  get(request) {
    const userAgent = request.headers.get("User-Agent");
    const contentType = request.headers.get("Content-Type");
    return { userAgent, contentType };
  },
});
