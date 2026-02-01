---
title: Sessions
---

# Sessions

Sessions let you persist state across requests: authentication, user
preferences, shopping carts, or any other server-side data you want tied to a
client. Primate manages session cookies, validates session data, and ensures
changes are committed only if your route succeeds.

## Configuration

Sessions are configured in `config/session.ts`. By default Primate uses an
in-memory store, but you may also use any store defined in `stores` or define
one directly in `config/session.ts`.

### Session options

|Option|Default|Description|
|-|-|-|
|[cookie.httpOnly](#cookie-httponly)|`true`|mark cookie as `HttpOnly`|
|[cookie.name](#cookie-name)|`"session_id"`|name of the session cookie|
|[cookie.path](#cookie-path)|`"/"`|path for which the cookie is valid|
|[cookie.sameSite](#cookie-samesite)|`"Lax"`|`SameSite` cookie policy|
|[store](#store)|default in-memory store|store managing sessions|

### `cookie.httpOnly`

Whether the session cookie should be marked `HttpOnly` (hidden from client-side
JavaScript).

### `cookie.name`

The name of the session cookie.

### `cookie.path`

The path for which the cookie is valid.

### `cookie.sameSite`

The `SameSite` cookie policy: `"Strict"`, `"Lax"`, or `"None"`.

### `store`

The session store. By default Primate uses a store managed in memory, but you
can use any store defined in `stores` or define one directly in
`config/session.ts`. The store will be used for both validating the data and
persisting it to a database of your choice.

The store must include a `session_id` field of type UUID. Primate uses this to
associate each stored record with the session cookie.




### Example

First create the store inside `stores`.

```ts
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";

export default store({
  id: key.primary(p.u32),
  session_id: p.string.uuid(),
  user_id: p.number,
  last_active: p.date,
  // additional fields as needed
});
```

Then refer to it in your configuration file.

```ts
import session from "primate/config/session";
import Session from "#store/Session";

export default session({
  store: Session,
});
```

## Session facade

The session facade is the API used in routes to interact with session state.
It hides cookie handling and persistence details, exposing a simple interface
to create, read, update, and destroy sessions.

| method / property | description |
| ----------------- | ----------- |
| `id`              | current session ID, if one exists |
| `exists`          | whether a session is active |
| `create(initial)` | start a session with initial data; generates a new ID |
| `get()`           | return current session data; throws if none |
| `try()`           | return data if a session exists, otherwise `undefined` |
| `set(data)`        | replace session data or derive from the previous state |
| `destroy()`       | end the session and clear the cookie |

### Usage in routes

Import the session facade via `#session`. It is bound to the session store you
used in `config/session.ts`.

```ts
import session from "#session";
import route from "primate/route";

route.get(() => {
  if (!session.exists) {
    session.create({ user_id: 42 });
  }

  const data = session.get();
  return `User ${data.user_id} last active at ${data.last_active.toISOString()}`;
});
```


### `SessionFacade` reference

```ts
interface SessionFacade<T> {
  readonly id: string | undefined;
  readonly exists: boolean;

  create(initial?: T): void;
  get(): Readonly<T>;
  try(): Readonly<T> | undefined;

  set(next: ((previous: Readonly<T>) => T) | T): void;

  destroy(): void;
}
```

## Validation

Primate validates data passed to `create` and `set` using the provided session
store.

```ts
import p from "pema";
import store from "primate/orm/store";
import key from "primate/orm/key";

export default store({
  id: key.primary(p.u32),
  session_id: p.string.uuid(),
  token: p.string.min(10),
});
```

```ts
import session from "#session";
import route from "primate/route";

route.post(() => {
  // Throws if token is shorter than 10 characters
  session.set({ token: "abc" });
});
```

!!!
Other operations like `get`, `try` or `destroy` don't take input and do not
trigger validation.
!!!

This ensures your session store never contains malformed data.
