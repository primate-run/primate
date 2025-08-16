# Sessions

Primate has built-in session support via cookies.

Primate creates and sends a session cookie with the response using the
`Set-Cookie` header. If the client issues a request with a cookie that
identifies an existing session id, no new cookie is created or sent.

The session is available using the `primate/session` import.

```js caption=routes/index.js
import session from "primate/session";

export default {
  get() {
    // send a 200 OK, plain text with the cookie's id as body
    return session.id;
  },
};
```

Here, a client requesting `GET /` will see its own session id.

## Use in stores

Like, to use the current session in a store file, import it from
`primate/session`.

```js
import session from "@primate/session";

export const actions = driver => {
  return {
    custom_action() {
      // assumes you have initialized your session with { user_id: USER_ID }
      const { user_id } = session.data;

      // use current user_id in query
    },
  };
};
```

## Configuration options

### name

Default `"session_id"`

The session cookie's name.

### sameSite

Default `"Strict"`

The cookie's `SameSite` attribute.

### path

Default `"/"`

The cookie's `Path` attribute.

### manager

Default [in-memory session manager][inMemorySessionManager]

The session manager. When called, it returns a function that is given an id
identifying a session and returns a session object to be set on `request`. The
return object must contain a `id` property. If the given id and the returned
`session.id` differ, a `Set-Cookie` header is added to the response.

Unless set, a default in-memory manager will be used, such that sessions do not
survive an app restart.

## Security

**Protocol downgrade attacks** cookies are sent with the `Secure` attribute if
Primate [is running on https](/guide/configuration#http-ssl-key-cert)

**Cross-site scripting attacks** cookies are always sent with the `HttpOnly`
attribute
