import Module from "#Module";
import type NextHandle from "#module/NextHandle";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";
import type SessionManager from "#session/Manager";
import storage from "#session/storage";

type CookieOptions = {
  httpOnly: "; HttpOnly" | "";
  path: string;
  sameSite: "Lax" | "None" | "Strict";
  secure: boolean;
};

type Cookie = (name: string, options: CookieOptions) => string;

const cookie: Cookie = (value, { httpOnly, path, sameSite, secure }) =>
  `${value};${httpOnly};Path=${path};Secure=${secure};SameSite=${sameSite}`;

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

    const id = request.cookies.try(name);
    const session = this.#manager.get(id as string);

    const response = await new Promise<Response>((resolve, reject) => {
      storage().run(session, async () => {
        try {
          resolve(await next(request) as Response);
        } catch (e) {
          reject(e);
        }
      });
    });

    if (session.new || session.id === id) {
      return response;
    }

    // if the session is in the pool and has a different id from the cookie, set
    const options: CookieOptions = {
      ...cookie_options,
      httpOnly: cookie_options.httpOnly ? "; HttpOnly" : "",
      secure: this.#secure,
    };

    // commit any session changes if necessary
    await this.#manager.commit();

    response.headers
      .set("set-cookie", cookie(`${name}=${session.id}`, options));

    return response;
  }
}
