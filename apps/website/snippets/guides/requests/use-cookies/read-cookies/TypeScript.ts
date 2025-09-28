// routes/index.ts
import route from "primate/route";

route.get(request => {
  const sessionId = request.cookies.get("session_id");
  return { sessionId };
});