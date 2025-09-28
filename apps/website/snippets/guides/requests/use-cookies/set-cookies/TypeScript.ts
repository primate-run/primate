import route from "primate/route";

route.get(() => {
  return new Response("Cookie set", {
    headers: {
      "Set-Cookie": "session_id=abc123; HttpOnly"
    }
  });
});