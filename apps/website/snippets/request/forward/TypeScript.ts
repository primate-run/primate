import route from "primate/route";

export default route({
  get(request) {
    return request.forward("https://upstream.internal/service", {
      Authorization: request.headers.try("authorization") ?? "",
      Accept: request.headers.try("accept") ?? "",
    });
  },
});
