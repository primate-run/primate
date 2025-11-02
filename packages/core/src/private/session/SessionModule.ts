import type DatabaseStore from "#database/Store";
import fail from "#fail";
import Module from "#Module";
import type NextHandle from "#module/NextHandle";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";
import kSerialize from "#session/k-serialize";
import SessionHandle from "#session/SessionHandle";
import storage from "#session/storage";
import p from "pema";
import type StoreSchema from "pema/StoreSchema";

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
  #store: DatabaseStore<StoreSchema>;
  #secure: boolean;

  constructor(app: ServeApp) {
    super();
    this.#app = app;
    this.#secure = app.secure;
    this.#store = app.session.store;

    const props = this.#store.type.properties;
    if (!("session_id" in props)) {
      throw fail("Session store must have a session_id field");
    }
    try {
      props.session_id.parse(crypto.randomUUID());
    } catch {
      throw fail("Session store session_id must be a string type");
    }
  }

  async serve(app: ServeApp, next: NextServe) {
    await this.#store.collection.create();
    return next(app);
  }

  async handle(request: RequestFacade, next: NextHandle) {
    const { name, ...config } = this.#app.session.cookie;
    const sid = request.cookies.try(name);

    // Look up session by session_id
    const existing = sid !== undefined
      ? await this.#store.find({ session_id: sid }, { limit: 1 })
      : [];
    const exists = existing.length > 0;

    let data: Record<string, unknown> | undefined = undefined;
    let dbId: string | undefined = undefined;

    if (exists) {
      const record = existing[0];
      const { id: _id, session_id: _sid, ...rest } = record;
      data = rest;
      dbId = _id as string;
    }

    const session_type = p.omit(this.#store.type, "id", "session_id");

    const session = new SessionHandle<Record<string, unknown>>(
      sid,
      data,
      session_type,
    );

    const response = await new Promise<Response>((resolve, reject) => {
      storage().run(session, async () => {
        try {
          resolve(await next(request));
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

    // no session existed -> either create or noop
    if (!exists) {
      if (!snap.exists) {
        // stale cookie -> clear
        if (sid !== undefined) {
          response.headers.append("set-cookie", cookie(name, "", {
            ...options, maxAge: 0,
          }));
        }
        return response;
      }

      // create new session
      await this.#store.insert({ session_id: snap.id!, ...snap.data! });
      response.headers.append("set-cookie", cookie(name, snap.id!, options));
      return response;
    }

    // from here: session existed (dbId is defined)

    // fast-path: session exists, same id and not dirty -> noop
    if (snap.exists && snap.id === sid && !snap.dirty) return response;

    // current absent -> destroy + clear cookie
    if (!snap.exists) {
      await this.#store.delete(dbId!);
      response.headers.append("set-cookie", cookie(name, "", {
        ...options, maxAge: 0,
      }));
      return response;
    }

    // session recreated in route -> destroy old, create new, set cookie
    if (snap.id !== sid) {
      await this.#store.delete(dbId!);
      await this.#store.insert({ session_id: snap.id!, ...snap.data! });
      response.headers.append("set-cookie", cookie(name, snap.id!, options));
      return response;
    }

    // dirty -> replace session contents
    await this.#store.update(dbId!, snap.data!);
    return response;
  }
}
