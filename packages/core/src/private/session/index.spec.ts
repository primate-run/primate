import InMemorySessionManager from "#session/InMemoryManager";
import type SessionManager from "#session/Manager";
import type SessionHandle from "#session/SessionHandle";
import SessionModule from "#session/SessionModule";
import storage from "#session/storage";
import test from "@rcompat/test";

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
  manager: SessionManager<unknown>,
  cookie: string | undefined,
  route: () => unknown | Promise<unknown>) {
  const request = { cookies: { try: () => cookie } } as any;
  return await new SessionModule(app(manager)).handle(request,
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

function app(manager: any): any {
  return {
    secure: true,
    session: {
      manager,
      cookie: {
        name: "sid",
        httpOnly: true,
        path: "/",
        sameSite: "Lax" as const,
      },
      schema: undefined,
    },
  };
}

test.case("types", async assert => {
  type X = { foo: string };

  const manager = new InMemorySessionManager<X>();
  const id = crypto.randomUUID();
  manager.create(id, { foo: "bar" });

  await run(manager, id, () => {
    const s = session<X>();
    assert(s.get()).type<Readonly<X>>().equals({ foo: "bar" });
  });
});

test.case("base / no changes -> noop", async assert => {
  const manager = new InMemorySessionManager();

  const response = await run(manager, undefined, () => { });
  assert(response.headers.getAll("set-cookie").length).equals(0);
});

test.case("no base, try() -> undefined", async assert => {
  type X = { u: string };
  const manager = new InMemorySessionManager<X>();

  const response = await run(manager, undefined, () => {
    const s = session<X>();
    // with no incoming cookie or create(), try() should be undefined
    assert(s.try()).type<Readonly<X>>().equals(undefined);
  });

  // still no cookie emitted
  assert(response.headers.getAll("set-cookie").length).equals(0);
});

test.case("no base, create -> set cookie", async assert => {
  type X = { user: string };
  const manager = new InMemorySessionManager<X>();

  const response = await run(manager, undefined, () => {
    const s = session<X>();
    s.create({ user: "u1" });
    assert(s.get()).type<Readonly<X>>().equals({ user: "u1" });
  });

  const cookies = response.headers.getAll("set-cookie");
  assert(cookies.length).equals(1);
  const id = cookies[0].split(";")[0].split("=")[1];
  assert(!!id).true();
  assert(manager.load(id)!.user).equals("u1");
});

test.case("base, no final -> destroy, clear cookie", async assert => {
  const manager = new InMemorySessionManager();
  const id = crypto.randomUUID();
  manager.create(id, { x: 1 });

  const response = await run(manager, id, () => {
    session().destroy();
  });

  assert(manager.load(id)).equals(undefined);
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
  const manager = new InMemorySessionManager<X>();
  const id = crypto.randomUUID();
  manager.create(id, { ok: true });

  const response = await run(manager, id, () => {
    const s = session<X>();
    // read-only
    assert(s.try()).type<Readonly<X>>().equals({ ok: true });
  });

  assert(manager.load(id)!.ok).equals(true);
  assert(response.headers.getAll("set-cookie").length).equals(0);
});

test.case("base, same id, changed -> replace, keep cookie", async assert => {
  const manager = new InMemorySessionManager<{ a?: number; b?: number }>();
  const id = crypto.randomUUID();
  manager.create(id, { a: 1 });

  const response = await run(manager, id, () => {
    session().set({ b: 2 });
  });

  assert(manager.load(id)!.b).equals(2);
  assert(response.headers.getAll("set-cookie").length).equals(0);
});

test.case("base, rotation -> destroy, create, set cookie", async assert => {
  const manager = new InMemorySessionManager<{ v: number }>();
  const id = crypto.randomUUID();
  manager.create(id, { v: 1 });

  const response = await run(manager, id, () => {
    const s = session();
    s.destroy();
    s.create({ v: 2 });
  });

  assert(manager.load(id)).equals(undefined);
  const cookies = response.headers.getAll("set-cookie");
  assert(cookies.length).equals(1);
  const new_id = cookies[0].split(";")[0].split("=")[1];
  assert(manager.load(new_id)!.v).equals(2);
});
