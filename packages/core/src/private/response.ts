import type ResponseFunction from "#response/ResponseFunction";

export default <T>(mime: string, mapper: (input: T) => BodyInit) =>
  (body: T, init?: ResponseInit): ResponseFunction<never> =>
    (app => app.respond(mapper(body), app.media(mime, init)));
