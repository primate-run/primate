# Routing

Primate uses filesystem-based routes. Route files are files in the `routes`
directory which requests map to. For example, the file at
`routes/user/profile.js` is used to handle a request to `/user/profile`. The
path may include parameters in brackets.

To illustrate this, consider that inside `routes`

|route                 |handles requests to                                   |
|----------------------|------------------------------------------------------|
|index.js              |`/`                                                   |
|user.js               |`/user`                                               |
|user/[user_id].js     |`/user/U_ID` with U_ID being a route parameter        |
|user/[[user_id]].js   |`/user` and `/user/U_ID`                              |
|user/[user_id=uuid].js|`/user/UUID` with UUID having the runtime type `uuid` |
|blog/[...subpath]     |`/blog/SUBPATH`, where SUBPATH may contain slashes    |
|blog/[[...subpath]]   |`/blog` and `/blog/SUBPATH`                           |

## Static routes

Static routes are simple routes not containing any path parameters. They are
given the highest priority in request to route resolution.

Examples of static routes are `user.js`, `foo/bar.js`, or `blog/view.js`.

Static routes that end in `index.js` are considered to map to the last slash.
Thus, `user.js` and `user/index.js` handle the same path. Primate will refuse
to start if it encounters both variants.

## Dynamic routes

### Path parameters

Path parameters are placeholders for a range of values. They are surrounded by
brackets, as in `[user].js`. Path parameter names are case sensitive, and a
path may contain any number of them, though it must not contain the same
parameter in the same case twice. They must be non-empty, i.e. matched by at
least one character.

By default, parameters will match anything in the path except `/`. Primate also
supports rest parameters that match slashes too.

### Typed parameters

Parameters can be also runtime-typed, in which case their value can be
restricted. `[age=number]` indicates that this path parameter must satisfy the
runtime type defined in `types/number.js` for the route to be matched.

### Optional parameters

Double brackets, as in `user/[[action]].js`, are equivalent to having two
identical files, `user.js` and `user/[action].js`. In other words, routes
containing optional parameters match with and without the parameter.

Optional parameters may only appear at the end of a route path.

You can combine optional and typed parameters.

### Rest parameters

Brackets starting with three dots, as in `user/[...action_tree].js`, indicate a
rest parameter. Unlike normal parameters, rest parameters match `/` as well and
can be thus be used to construct subpaths. For example, in
`https://github.com/primate-run/primate/tree/master/docs/guide`, `docs/guide`
may be considered a subpath.

Rest parameters may only appear at the end of a route path. They may also be
optional, that is, matching with and without the parameter, by using two
brackets.

### Optional rest parameters

Double brackets with three dots, as in `user/[[...action_tree]].js`, are
equivalent to having two identical files, `user.js` and
`user/[...action_tree].js`. In other words, routes containing optional rest
parameters may match with and witout the greedy parameter.

In addition to normal parameters, there are greedy rest parameters in the form
of `[...rest]` that also match `/` as part of the path. Rest parameters may
only appear at the end of a route.

Optional rest parameters may only appear at the end of a route.

## HTTP verbs

Every route file exports an object containing one or many HTTP verb functions.

```js caption=routes/user/profile.js
export default {
  get() {
    return "this is a GET request";
  },
  post() {
    return "this is a POST request";
  },
};
```

In this example, accessing the path `/user/profile` using any of the specified
verbs will return a plain-text response with the given string.

## The request object

Route verb functions accept a single parameter representing request data. This
aggregate object allows easy access to the request `body`, any `path`
parameters defined with brackets, the `query` string split into parts,
`cookies` as well as other `headers` and a reference to the `original` WHATWG
Request object. The aggregate nature of this object allows you to pull in what
you need using object destructuring.

### body

The request body.

```js caption=routes/your-name.js
export default {
  post(request) {
    return `Hello, ${request.body.name}`;
  },
}
```

If a client sends a POST request to `/your-name` using the content type
`application/json` and `{"name": "Donald"}` as body, this route will respond
with 200 saying  `Hello, Donald`.

Primate will attempt to decode the body according to the `Content-Type` header
used in the request.

* `application/x-www-form-urlencoded`, which is primarily used in HTML forms,
decodes the form fields into object properties
* `application/json` decodes the given JSON string using `JSON.parse`
* `multipart/form-data` decodes the given form using `FormData`, making files
available as `Blob` objects and other fields as normal object properties

```js caption=routes/your-full-name.js
export default {
  post(request) {
    const { name } = request.body;

    if (name === undefined) {
      return "You haven't specified your name";
    }

    return `Hello, ${name}`;
  }
}
```

In this example, if a client sends a request to `/your-full-name` with a
URL-encoded form (`application/x-www-form-urlencoded`) or JSON data
(`application/json`) with a field `name` in its body, Primate will respond by
saying Hello and the provided name.

### path

The request's path, an object containing path parameters.

```js caption=routes/users/[user].js
import error from "primate/error";

const users = ["Donald", "Ryan"];

export default {
  post(request) {
    const user = request.path.get("user");

    if (users.includes(user)) {
      return `Hello, ${user}`;
    }

    return error("Unknown user");
  },
};
```

If a user requests POST `/users/Donald` or `/users/Ryan`, Primate will respond
with `200`, saying Hello. It will otherwise reply with `404` saying Unknown
user.

We will later handle [routes with parameters](#parameters) in depth.

### query

The request's query string, broken down into its constituent parts.

```js caption=routes/users.js
import error from "primate/error";

const users = ["Donald", "Ryan"];

export default {
  post(request) {
    const user = request.query.get("user");

    if (users.includes(user)) {
      return `Hello, ${user}`;
    }

    return error("Unknown user");
  },
};
```

If a user requests POST `/users?user=Donald` or `/users?user=Ryan`, Primate
will respond with `200`, otherwise with `404`.

### cookies

The request's `Cookie` header, broken down into individual cookies.

```js caption=routes/current-user.js
import error from "primate/error";

const users = ["Donald", "Ryan"];

export default {
  post(request) {
    const { user } = request.cookies;

    if (users.includes(user)) {
      return `Hello, ${user}`;
    }

    return error("Unknown user");
  },
};
```

If a user requests POST `/current-user` with the `Cookie` header set to
`user=Donald` or `user=Ryan`, Primate will respond with `200`, otherwise with
`404`.

### headers

The request's individual headers.

```js caption=routes/current-x-user.js
import error from "primate/error";

const users = ["Donald", "Ryan"];

export default {
  post(request) {
    const user = request.headers.get("X-User");

    if (users.includes(user)) {
      return `Hello, ${user}`;
    }

    return error("Unknown user");
  },
};
```

If a user requests POST `/current-x-user` with a `X-User` header set to
`Donald` or `Ryan`, Primate will respond with `200`, otherwise with `404`.

### original

The `original` property of the request object provides access to the original
WHATWG Request object.


[types]: /guide/types#path-parameters
