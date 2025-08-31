import Module from "#Module";
import type NextHandle from "#module/NextHandle";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";
import kSerialize from "#session/k-serialize";
import type SessionManager from "#session/Manager";
import SessionHandle from "#session/SessionHandle";
import storage from "#session/storage";

type CookieOptions = {
  httpOnly: boolean;
  maxAge?: number; // seconds
  path: string;
  sameSite: "Lax" | "None" | "Strict";
  secure: boolean;
};

const cookie = (name: string, value: string, options: CookieOptions) => {
  const parts = [`${name}=${value}`];
  parts.push(`Path=${options.path}`);
  parts.push(`SameSite=${options.sameSite}`);

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");

  return parts.join("; ");
};

export default class SessionModule extends Module {
  name = "builtin/session";

  #app: ServeApp;
  #manager: SessionManager<unknown>;
  #secure: boolean;

  constructor(app: ServeApp) {
    super();

    this.#app = app;
    this.#secure = app.secure;
    this.#manager = app.session.manager;
  }

  async serve(app: ServeApp, next: NextServe) {
    // initialize the session manager
    await this.#manager.init?.();

    return next(app);
  }

  async handle(request: RequestFacade, next: NextHandle) {
    const { name, ...config } = this.#app.session.cookie;

    const sid = request.cookies.try(name);

    const data = sid !== undefined ? await this.#manager.load(sid) : undefined;
    const id = data !== undefined ? sid : undefined;

    const session = new SessionHandle(id, data, this.#app.session.schema);

    const response = await new Promise<Response>((resolve, reject) => {
      storage().run(session, async () => {
        try {
          resolve(await next(request) as Response);
        } catch (e) {
          reject(e);
        }
      });
    });

    const snap = session[kSerialize]();

    // no cookie coming in, no session created
    if (sid === undefined && !snap.exists) return response;

    const options: CookieOptions = {
      httpOnly: !!config.httpOnly,
      path: config.path,
      sameSite: config.sameSite,
      secure: this.#secure,
    };

    // no session existed -> either create or noop (noop already returned)
    if (id === undefined) {
      if (!snap.exists) {
        // stale cookie -> clear; no cookie, noop
        if (sid !== undefined) {
          response.headers.append("set-cookie", cookie(name, "", {
            ...options, maxAge: 0,
          }));
        }
        return response;
      }
      // safe due to fast-path
      await this.#manager.create(snap.id!, snap.data!);
      response.headers.append("set-cookie", cookie(name, snap.id!, options));
      return response;
    }

    // from here: session existed (id is defined)

    // fast-path: session exists, same id and not dirty -> noop
    if (snap.exists && snap.id === id && !snap.dirty) return response;

    // current absent -> destroy + clear cookie
    if (!snap.exists) {
      await this.#manager.destroy(id);
      response.headers.append("set-cookie", cookie(name, "", {
        ...options, maxAge: 0,
      }));
      return response;
    }

    // session recreated in route -> destroy old, create new, set cookie
    if (snap.id !== id) {
      await this.#manager.destroy(id);
      await this.#manager.create(snap.id!, snap.data!);
      response.headers.append("set-cookie", cookie(name, snap.id!, options));
      return response;
    }

    // dirty -> replace session contents
    await this.#manager.save(id, snap.data!);

    return response;
  }
}
