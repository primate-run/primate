import type RequestFacade from "@primate/core/RequestFacade";

export default (request: RequestFacade) => ({
  body: JSON.stringify(request.body),
  cookies: JSON.stringify(request.cookies),
  headers: JSON.stringify(request.headers),
  path: JSON.stringify(request.path),
  query: JSON.stringify(request.query),
  url: request.url,
});
