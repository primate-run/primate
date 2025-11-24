import type ServeApp from "#serve/App";
import type MaybePromise from "@rcompat/type/MaybePromise";

export default <T>(mime: string, mapper: (input: T) => BodyInit) =>
  (body: T, init?: ResponseInit): (app: ServeApp) => MaybePromise<Response> =>
    (app => app.respond(mapper(body), app.media(mime, init)));
