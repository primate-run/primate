import route from "primate/route";

route.get(request => {
  const url = request.url;

  // prefer request.query over url.searchParams
  const page = url.searchParams.get("page") ?? "1";

  // build a new URL relative to the request
  const cdn = new URL("/assets/logo.svg", url);

  // returned as JSON
  return { page, cdn: cdn.href };
});
