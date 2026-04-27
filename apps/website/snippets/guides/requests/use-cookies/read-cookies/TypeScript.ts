// routes/index.ts
import route from "primate/route";

export default route({
  get(request) {
    const sessionId = request.cookies.get("session_id");
    return { sessionId };
  },
});
