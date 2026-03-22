import E from "#error";
import create from "#module/create";
import type { Store } from "#orm/store";
import type Config from "#session/Config";
import kSerialize from "#session/k-serialize";
import SessionHandle from "#session/SessionHandle";
import storage from "#session/storage";
import type { Dict } from "@rcompat/type";
import type { StoreSchema } from "pema";
import p from "pema";

type CookieOptions = {
  httpOnly: boolean;
  maxAge?: number; // seconds
  path: string;
  sameSite: "Lax" | "None" | "Strict";
  secure: boolean;
};

function cookie(name: string, value: string, options: CookieOptions) {
  const parts = [`${name}=${value}`];
  parts.push(`Path=${options.path}`);
  parts.push(`SameSite=${options.sameSite}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
};

export default function session_module(config: Config) {
  let secure: boolean;
  const store: Store<StoreSchema> = config.store;

  const props = store.type.properties;
  if (!("session_id" in props)) throw E.session_missing_id();

  try {
    props.session_id.parse(crypto.randomUUID());
  } catch {
    throw E.session_id_string();
  }

  return create({
    name: "builtin/session",
    setup({ onServe, onHandle }) {
      onServe(async app => {
        secure = app.secure;
        await store.table.create();
      });

      onHandle(async (request, next) => {
        const { name, ...cookie_config } = config.cookie;
        const sid = request.cookies.try(name);

        // Look up session by session_id
        const existing = sid !== undefined
          ? await store.find({ where: { session_id: sid }, limit: 1 })
          : [];
        const exists = existing.length > 0;

        let data: Dict | undefined = undefined;
        let db_id: string | undefined = undefined;

        if (exists) {
          const record = existing[0];
          const { id: _id, session_id: _sid, ...rest } = record;
          data = rest;
          db_id = _id as string;
        }

        const session_type = p.omit(store.type, "id", "session_id");

        const session = new SessionHandle<Dict>(
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

        const options: CookieOptions = { ...cookie_config, secure };

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
          await store.insert({ session_id: snap.id!, ...snap.data! });
          response.headers.append("set-cookie", cookie(name, snap.id!, options));
          return response;
        }

        // from here: session existed (db_id is defined)

        // fast-path: session exists, same id and not dirty -> noop
        if (snap.exists && snap.id === sid && !snap.dirty) return response;

        // current absent -> destroy + clear cookie
        if (!snap.exists) {
          await store.delete(db_id!);
          response.headers.append("set-cookie", cookie(name, "", {
            ...options, maxAge: 0,
          }));
          return response;
        }

        // session recreated in route -> destroy old, create new, set cookie
        if (snap.id !== sid) {
          await store.delete(db_id!);
          await store.insert({ session_id: snap.id!, ...snap.data! });
          response.headers.append("set-cookie", cookie(name, snap.id!, options));
          return response;
        }

        // dirty -> replace session contents
        await store.update(db_id!, { set: snap.data! });
        return response;
      });
    },
  });
}
