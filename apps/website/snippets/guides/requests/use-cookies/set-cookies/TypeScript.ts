import route from "primate/route";

export default route({
  get() {
    return new Response("Cookie set", {
      headers: {
        "Set-Cookie": "session_id=abc123; HttpOnly"
      }
    });
  },
});
