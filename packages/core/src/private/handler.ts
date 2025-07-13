import type ServeApp from "#ServeApp";
import type MaybePromise from "@rcompat/type/MaybePromise";

export default <T>(mime: string, mapper: (input: T) => BodyInit) =>
  (body: T, init?: ResponseInit): (app: ServeApp) => MaybePromise<Response> =>
    (app => app.respond(mapper(body), app.media(mime, init)));
