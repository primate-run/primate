import route from "primate/route";

// request.body is always null in GET requests
route.get(request => "Hello from GET!");

// body parsing turned off, request.body will be null
route.post(request => request.forward("https://my.domain"),
  { parseBody: false });
