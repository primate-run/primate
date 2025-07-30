import Module from "#module/Module";
import type NextHandle from "#module/NextHandle";
import type RequestFacade from "#RequestFacade";
import type ServeApp from "#ServeApp";
import type SessionManager from "#session/Manager";
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

export default class SessionModule extends Module {
  name = "builtin/session";

  #app: ServeApp;
  #manager: SessionManager<string, unknown>;
  #secure: boolean;

  constructor(app: ServeApp) {
    super();

    this.#app = app;
    this.#secure = app.secure;
    this.#manager = app.session.manager;
  }

  async handle(request: RequestFacade, next: NextHandle) {
    const { name, ...cookie_options } = this.#app.session.cookie;

    const id = request.cookies[name];
    const session = this.#manager.get(id as string);

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
      secure: this.#secure,
    };

    // commit any session changes if necessary
    await this.#manager.commit();

    response.headers
      .set("set-cookie", cookie(`${name}=${session.id}`, options));

    return response;
  }
}
