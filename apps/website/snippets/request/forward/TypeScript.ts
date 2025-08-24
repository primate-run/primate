import route from "primate/route";

route.get(request => {
  return request.forward("https://upstream.internal/service", {
    Authorization: request.headers.try("authorization") ?? "",
    Accept: request.headers.try("accept") ?? "",
  });
}, { parseBody: false });
