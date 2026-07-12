import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.sse(source => {
      // push event to client
      source.send("open", "hi!");
    });
  },
});
