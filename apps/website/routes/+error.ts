import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.view("Error.marko", {
      pathname: request.url.pathname,
    });
  },
});
