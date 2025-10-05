# Sessions

Sessions let you persist state across requests: authentication, user
preferences, shopping carts, or any other server-side data you want tied to a
client. Primate manages session cookies, validates session data, and ensures
changes are committed only if your route succeeds.

## Configuration

Sessions are configured in `config/session.ts`. By default, Primate uses an
in-memory manager and a secure HTTP-only cookie named `session_id`.

### Session options

|Option|Default|Description|
|-|-|-|
|[cookie.httpOnly](#cookie-httponly)|`true`|mark cookie as `HttpOnly`|
|[cookie.name](#cookie-name)|`"session_id"`|name of the session cookie|
|[cookie.path](#cookie-path)|`"/"`|path for which the cookie is valid|
|[cookie.sameSite](#cookie-samesite)|`"Lax"`|`SameSite` cookie policy|
|[manager](#manager)|`InMemorySessionManager`|session manager instance|
|[schema](#schema)|`undefined`|validation schema for session data|

### `cookie.httpOnly`

Whether the session cookie should be marked `HttpOnly` (hidden from client-side
JavaScript).

### `cookie.name`

The name of the session cookie.

### `cookie.path`

The path for which the cookie is valid.

### `cookie.sameSite`

The `SameSite` cookie policy: `"Strict"`, `"Lax"`, or `"None"`.

### `manager`

The session manager. By default Primate uses an in-memory session manager that
resets on server restart. You can provide any custom manager that extends
`SessionManager`.

### `schema`

Optional schema to validate session data at runtime. Any schema with a
`parse(input: unknown): T` method works. Primate recommends its own validation
library, Pema.

### Example

```ts
import session from "primate/config/session";
import pema from "pema";
import string from "pema/string";
import number from "pema/number";

export default session({
  cookie: {
    name: "my_session",
    httpOnly: true,
    sameSite: "Lax",
  },
  schema: pema({
    userId: number,
    username: string,
  }),
});
```

## Session facade

The session facade is the API you use in routes to interact with session state.
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

Import the session facade via `#session`. It is bound to the session data type
you declared in `config/session.ts`.

```ts
import session from "#session";
import route from "primate/route";

route.get(() => {
  if (!session.exists) {
    session.create({ userId: 42 });
  }

  const data = session.get();
  return `User ${data.userId} last active at ${data.lastActivity.toISOString()}`;
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

## Managers

A **session manager** is responsible for storing and retrieving session data.
The default is in-memory and resets when the server restarts.

Primate leaves persistence to the manager. This contract defines the minimum
required methods:

```ts
export default abstract class SessionManager<Data> {
  init(): void | Promise<void> { }

  abstract load(id: string): Data | undefined | Promise<Data | undefined>;
  abstract create(id: string, data: Data): void | Promise<void>;
  abstract save(id: string, data: Data): void | Promise<void>;
  abstract destroy(id: string): void | Promise<void>;
}
```

Any manager that implements this interface can be plugged in through
`config/session.ts`.

!!!
The contract isn't just type-based. The manager must extend `SessionManager`;
this is validated during start-up.
!!!

### Example: file-based manager

```ts
import is from "@rcompat/assert/is";
import FileRef from "@rcompat/fs/FileRef";
import type JSONValue from "@rcompat/type/JSONValue";
import SessionManager from "primate/session/Manager";

export default class FileSessionManager extends SessionManager<unknown> {
  #directory: FileRef;

  constructor(directory: string = "/tmp/sessions") {
    is(directory).string();

    super();
    this.#directory = new FileRef(directory);
  }

  async init() {
    await this.#directory.create({ recursive: true });
  }

  async load(id: string) {
    is(id).uuid("invalid session id");

    try {
      return await this.#directory.join(id).json();
    } catch {
      return undefined;
    }
  }

  async create(id: string, data: JSONValue) {
    is(id).uuid("invalid session id");

    await this.#directory.join(id).writeJSON(data);
  }

  async save(id: string, data: JSONValue) {
    await this.create(id, data);
  }

  async destroy(id: string) {
    is(id).uuid("invalid session id");

    await this.#directory.join(id).remove();
  }
}
```

!!!
This manager validates IDs as UUIDs to prevent path traversal attacks, making
it safe for use as an example. For production, you'll likely want Redis or a
DB-backed manager.
!!!

Then configure:

```ts
import session from "primate/config/session";
import FileSessionManager from "./FileSessionManager.ts";

export default session({
  manager: new FileSessionManager(),
});
```

!!!
While the session manager can be asynchronous (save to filesystem or database),
all session facade operations are sync — changes are committed once the route
has run successfully, and are rolled back upon error.
!!!

## Validation

When you provide a schema, Primate validates data passed to `create` and `set`:

```ts
import pema from "pema";
import string from "pema/string";
import session from "#session";
import route from "primate/route";

const Data = pema({ token: string.min(10) });

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
