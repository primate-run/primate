import response from "primate/response";
import route from "primate/route";

route.get(() => response.sse({
  // connection opened
  open(source) {
    // push event to client
    source.send("open", "hi!");
  },
  // connection closed
  close() { },
}));
