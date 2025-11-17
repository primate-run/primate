import InMemoryDatabase from "#database/InMemoryDatabase";
import Store from "#database/Store";
import type SessionHandle from "#session/SessionHandle";
import SessionModule from "#session/SessionModule";
import storage from "#session/storage";
import test from "@rcompat/test";
import p from "pema";

const new_store = () => new Store({
  id: p.primary,
  session_id: p.string.uuid(),
  foo: p.string.optional(),
  user: p.string.optional(),
  x: p.number.optional(),
  ok: p.boolean.optional(),
  a: p.number.optional(),
  b: p.number.optional(),
  v: p.number.optional(),
}, { database: new InMemoryDatabase(), name: "session" });

class MultiHeaders {
  #map = new Map<string, string[]>();

  append(key: string, value: string) {
    const lowered = key.toLowerCase();
    const array = (this.#map.get(lowered) ?? []).concat(value);
    this.#map.set(lowered, array);
  }

  getAll(key: string) {
    return this.#map.get(key.toLowerCase()) ?? [];
  }
}

async function run(
  store: Store<any>,
  cookie: string | undefined,
  route: () => unknown | Promise<unknown>) {
  const request = { cookies: { try: () => cookie } } as any;
  return await new SessionModule(true, config(store)).handle(request,
    async () => {
      const response = { headers: new MultiHeaders() } as any;
      await route();
      return response;
    },
  ) as any;
}

function session<T>() {
  const h = storage().getStore() as SessionHandle<T> | undefined;
  if (!h) throw new Error("no session handle in ALS");
  return h;
}

function config(store: Store<any>): any {
  return {
    session: {
      store,
      cookie: {
        name: "sid",
        httpOnly: true,
        path: "/",
        sameSite: "Lax" as const,
      },
    },
  };
}

test.case("types", async assert => {
  type X = { foo: string };

  const store = new_store();
  const session_id = crypto.randomUUID();
  store.insert({ session_id, foo: "bar" });

  await run(store, session_id, () => {
    const s = session<X>();
    assert(s.get()).type<Readonly<X>>().equals({ foo: "bar" });
  });
});

test.case("base / no changes -> noop", async assert => {
  const store = new_store();

  const response = await run(store, undefined, () => { });
  assert(response.headers.getAll("set-cookie").length).equals(0);
});

test.case("no base, try() -> undefined", async assert => {
  type X = { u: string };
  const store = new_store();

  const response = await run(store, undefined, () => {
    const s = session<X>();
    // with no incoming cookie or create(), try() should be undefined
    assert(s.try()).type<Readonly<X>>().equals(undefined);
  });

  // still no cookie emitted
  assert(response.headers.getAll("set-cookie").length).equals(0);
});

test.case("no base, create -> set cookie", async assert => {
  type X = { user: string };
  const store = new_store();

  const response = await run(store, undefined, () => {
    const s = session<X>();
    s.create({ user: "u1" });
    assert(s.get()).type<Readonly<X>>().equals({ user: "u1" });
  });

  const cookies = response.headers.getAll("set-cookie");
  assert(cookies.length).equals(1);
  const session_id = cookies[0].split(";")[0].split("=")[1];
  assert(!!session_id).true();
  assert((await store.find({ session_id }))[0]!.user).equals("u1");
});

test.case("base, no final -> destroy, clear cookie", async assert => {
  const store = new_store();
  const session_id = crypto.randomUUID();
  const { id } = await store.insert({ x: 1, session_id });

  const response = await run(store, session_id, () => {
    session().destroy();
  });

  assert(await store.try(id)).equals(undefined);
  const cookies = response.headers.getAll("set-cookie");
  assert(cookies.length).equals(1);
  assert(cookies[0].startsWith("sid=")).true();
  const c = cookies[0];
  // attributes from app config
  assert(c.includes("Path=/")).true();
  assert(/(?:^|; )SameSite=Lax(?:;|$)/.test(c)).true();
  assert(/(?:^|; )HttpOnly(?:;|$)/.test(c)).true();

});

test.case("base, same id, unchanged -> noop", async assert => {
  type X = { ok: boolean };
  const store = new_store();
  const session_id = crypto.randomUUID();
  const { id } = await store.insert({ ok: true, session_id });

  const response = await run(store, session_id, () => {
    const s = session<X>();
    // read-only
    assert(s.try()).type<Readonly<X>>().equals({ ok: true });
  });

  assert((await store.get(id)).ok).equals(true);
  assert(response.headers.getAll("set-cookie").length).equals(0);
});

test.case("base, same id, changed -> replace, keep cookie", async assert => {
  const store = new_store();
  const session_id = crypto.randomUUID();
  const { id } = await store.insert({ a: 1, session_id });

  const response = await run(store, session_id, () => {
    session().set({ b: 2 });
  });

  assert((await store.get(id)).b).equals(2);
  assert(response.headers.getAll("set-cookie").length).equals(0);
});

test.case("base, rotation -> destroy, create, set cookie", async assert => {
  const store = new_store();
  const session_id = crypto.randomUUID();
  const { id } = await store.insert({ v: 1, session_id });

  const response = await run(store, session_id, () => {
    const s = session();
    s.destroy();
    s.create({ v: 2 });
  });

  assert(await store.try(id)).equals(undefined);
  const cookies = response.headers.getAll("set-cookie");
  assert(cookies.length).equals(1);
  const new_id = cookies[0].split(";")[0].split("=")[1];
  assert((await store.find({ session_id: new_id }))[0].v).equals(2);
});
