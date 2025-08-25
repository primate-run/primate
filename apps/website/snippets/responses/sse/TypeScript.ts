import sse from "primate/response/sse";
import route from "primate/route";

route.get(() => sse({
  // connection opened
  open(source) {
    // push event to client
    source.send("open", "hi!");
  },
  // connection closed
  close() { },
}));
