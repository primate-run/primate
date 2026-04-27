import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.sse({
      // connection opened
      open(source) {
        // push event to client
        source.send("open", "hi!");
      },
      // connection closed
      close() { },
    });
  },
});
