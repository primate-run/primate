import type RequestHook from "#module/RequestHook";
import type ServeApp from "#ServeApp";
import storage from "#session/storage";

type CookieOptions = {
  path: string;
  secure: boolean;
  http_only: "; HttpOnly" | "";
  same_site: "Strict" | "Lax" | "None";
};

type Cookie = (name: string, options: CookieOptions) => string;

const cookie: Cookie = (value, { path, secure, http_only, same_site }) =>
  `${value};${http_only};Path=${path};Secure=${secure};SameSite=${same_site}`;

export default (app: ServeApp): RequestHook => async (request, next) => {
  const { name, ...cookie_options } = app.session.cookie;
  const manager = app.session.manager;

  const id = request.cookies[name];
  const session = manager.get(id as string);

  const response = await new Promise<Response>(resolve => {
    storage().run(session, async () => {
      resolve(await next(request) as Response);
    });
  });

  if (session.new || session.id === id) {
    return response;
  }

  // if the session is in the pool and has a different id from the cookie, set
  const options: CookieOptions = {
    ...cookie_options,
    http_only: cookie_options.http_only ? "; HttpOnly" : "",
    secure: app.secure,
  };

  // commit any session changes if necessary
  await manager.commit();

  response.headers.set("set-cookie", cookie(`${name}=${session.id}`, options));

  return response;
};
