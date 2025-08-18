import type ResponseFunction from "#response/ResponseFunction";
import Status from "@rcompat/http/Status";

type Spread<N extends number, Ns extends number[] = []> =
  Ns["length"] extends N
  ? Ns[number]
  : Spread<N, [...Ns, Ns["length"]]>;

type Range<F extends number, T extends number> = Exclude<Spread<T>, Spread<F>>;

type Redirection = Range<300, 308>;

/**
 * Redirect request
 * @param location location to redirect to
 * @param status redirection 3xx code
 * @return Response rendering function
 */
export default (location: string, status?: Redirection): ResponseFunction =>
  // no body
  app => app.respond(null, {
    headers: { Location: location },
    status: status ?? Status.FOUND,
  });
