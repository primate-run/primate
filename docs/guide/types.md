# Types

On the web, values are inherently strings. Whether it's a URL's path, query
string parts, or the submitted fields of a form, everything boils down to
strings. When working on the backend with Primate, it is often important to
assert a runtime type concept, including a way to coerce strings into a given
type and validate that coerced values lie within an expected range or satisfy
other conditions.

!!!
Primate types aren't programming types in a real sense. Unlike static types,
they provide a form of runtime safety. You can think of them as coercive value
predicates; a `boolean` runtime type would consider both boolean `true` and
string `"true"` as true, which is what you would expect on the web.
!!!

## Defining

Types are defined in the `types` directory, unless specified
[elsewise](/guide/configuration#location-types) in the configuration. Type
filenames are alphanumeric and lowercase-first. Any files not starting with a
lowercase letter will be ignored.

Type files are described using an object containing a `base` (string) and a
`validate` (function) property.

Here is an example for a `number` type, a type that makes sure a string is
numeric and outputs its as a number.

```js caption=types/number.js
// `is` asserts invariants, `numeric` returns true if a string is numeric
import is from "@rcompat/invariant/is";
import numeric from "@rcompat/invariant/numeric";

export default {
  base: "f64",
  validate(value) {
    // make sure value is a string, otherwise throw
    is(value).string();

    const n = numeric(value) ? Number(value) : value;
    if (typeof n === "number") {
      return n;
    }
    throw new Error(`\`${value}\` is not a number`);
  },
};
```

If a string can be successfully converted to a number, a `number` type will
returned. Otherwise the `validate` function will throw.

!!!
Unlike the example, there is nothing stopping you from accepting other base
types like `number` or `bigint` as input, but your main input type will usually
be strings.
!!!

!!!
The `base` property is relevant when you use other languages aside from
JavaScript (like Go).
!!!

You can also create more elaborate types, like `uuid`.

```js caption=types/uuid.js
import is from "@rcompat/invariant/is";

const valid = /^[^\W_]{8}-[^\W_]{4}-[^\W_]{4}-[^\W_]{4}-[^\W_]{12}$/u;

export default {
  base: "string",
  validate(value) {
    // make sure value is a string, otherwise throw
    is(value).string();

    if (valid.test(value)) {
      return value;
    }
    throw new Error(`${value} is not a valid UUID`);
  },
};
```

The `uuid` type makes sure a string is a valid UUID. Here no type conversion is
necessary, as UUIDs are strings.

!!!
The `number` and `uuid` types are so common that they're included in a Primate
module, [`@primate/types`](/modules/types), alongside many other commonly used
types.
!!!

## Using

Primate types can be imported and used anywhere in your application to ensure
certain code invariants are met. In addition, many of Primate's built-in
features integrate seamlessly with the types you define.

### Path parameters

In Primate's [filesystem-based routes](/guide/routes), path parameters may be
additionally specified with types to ensure the path adheres to a certain
format.

```js caption=routes/user/[userId=uuid].js
export default {
  /*
    GET /user/b8c5b7b2-4f4c-4939-81d8-d1bdadd888c5
    -> "User ID is b8c5b7b2-4f4c-4939-81d8-d1bdadd888c5"

    GET /user/1
    -> Error
  */
  get(request) {
    const userId = request.path.get("userId");
    return `User ID is ${userId}`;
  }
}
```

In the above example, using the `uuid` type we previously defined in `types`,
we make sure the route function is only executed if the `GET` request is to a
pathname starting with `user/` and followed by a valid UUID.

### Request query

Likewise, the request's query string parts, which we previously accessed using
`request.query.get`, may be typed to ensure adherence to a given format. This
can be achieved manually by importing the type. Here we'll also create an
additional `user` type coercing the ID into a user object, to get a proper user
object and not just the ID.

```js caption=types/user.js
import number from "./number.js";

const users = [
  {
    id: 6161
    name: "Donald",
  },
];

export default {
  type: "object",
  validate(id) {
    // ids must be numbers
    const n = number(id);

    const user = users.find(user => user.id === n);
    if (user !== undefined) {
      return user;
    }
    throw new Error(`no user with ID ${id}`);
  },
};
```

We then use the type to assert the id is a user id and coerce it into a user,
returning the user object as JSON.

```js caption=routes/user.js
import user from "../types/user.js";

export default {
  /*
    GET /user?userId=6161
    -> `{ id: 6161, name: "Donald" }`

    GET /user?userId=1616
    -> Error
  */
  get(request) {
    return user.validate(request.query.get("userId"));
  }
}
```

This is generally OK, but as routes may be arbitrarily nested, it can make
importing from relative paths unseemly. For that, Primate enhances the `query`
object with dispatcher functions in the form `getX`, where `x` is the type name,
for validating a property's value.

```js caption=routes/user.js
export default {
  /*
    GET /user?userId=6161
    -> `{ id: 6161, name: "Donald" }`

    GET /user?userId=1616
    -> Error
  */
  get(request) {
    // get the "userId" property from the request query, running it through the
    // `user` type, returning the user object or throwing in case of a failure
    return request.query.getUser("userId");
  }
}
```

Primate here adds any defined types as dispatcher `getX` functions of the
`request.query` object, in addition to the `get` function which allows direct
access to the query string parts. As there is no user in our dataset with the
ID `1616`, if a client tries to access `GET /user?userId=1616`, the route will
throw with the client redirected to an error page.

### Headers and cookies

In identical fashion to the request query, you can make sure certain headers
follow a given format, by retrieving them using the appropriate type getter.

```js caption=routes/user.js
export default {
  /*
    GET /user
    X-User-Id: 6161
    -> `{ id: 6161, name: "Donald" }`

    GET /user
    X-User-Id: 1616
    -> Error
  */
  get(request) {
    return request.headers.getUser("X-User-Id");
  }
}
```

The same applies to cookies.

```js caption=routes/user.js
export default {
  /*
    GET /user
    Cookie: userId=6161
    -> `{ id: 6161, name: "Donald" }`

    GET /user
    Cookie: userId=1616
    -> Error
  */
  get(request) {
    return request.cookies.getUser("userId");
  }
}
```

## Related modules

Primate's ecosystem extends the concept of runtime types by providing many
defaults and integrating with database types.

### Types

Most of the time you won't need to define your own runtime types unless you
have very specific use cases. Primate's [Types module](/modules/types) comes
with a handful of common types. By importing and loading this module, its types
will be injected and available wherever types are used.

### Store

The Primate [Store module](/modules/store), used for data persistence, also
integrates with Primate's runtime type concept and extends upon it.
