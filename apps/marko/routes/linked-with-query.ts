import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    if (request.url.search === "?foo") {
      return response.redirect("/linked-with-query?foo=bar");
    }

    return response.view("LinkedWithQuery.marko");
  },
});

