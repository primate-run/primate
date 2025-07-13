import type RequestFacade from "@primate/core/RequestFacade";

export default (request: RequestFacade) => ({
  url: request.url,
  body: JSON.stringify(request.body),
  path: JSON.stringify(request.path),
  query: JSON.stringify(request.query),
  headers: JSON.stringify(request.headers),
  cookies: JSON.stringify(request.cookies),
});
