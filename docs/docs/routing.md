# Routing

Routing in Primate refers to matching of incoming HTTP requests to backend
logic. To this end, Primate uses filesystem-based routes -- it breaks down a
request *path* to its constituent parts and maps it to a file in the `routes`
directory.

## Filesystem-based routing

In filesystem-based routing, the files you create are mapped by paths in HTTP
requests. For example, a request to `primate.run` matches `index.ts`, while a
request to `primate.run/docs` matches `docs.ts`.

Route files may contain path parameters denoted with brackets. Resolved
parameters are passed to the [route handler](#route-handlers) as
`request.path`.

|Request path|Route file|`*` matches|
|-|-|-|
|`/`|`index.ts`|
|`/user`|`user.ts`|
|`/user/*`|[user/\[id\].ts](#dynamic-routes)|anything except `/`|
|`/user/*`|[user/\[...id\].ts](#rest-routes)|anything including `/`|
|`/user`,`/user/*`|[path/\[\[id\]\].ts](#optional-routes)|anything except `/`|
|`/user`,`/user/*`|[path/\[\[...id\]\].ts](#rest-routes)|anything including `/`|

### Static routes
Static routes are given the highest priority in request to route resolution.

|Request path|Route file|
|-|-|
|`/`|`index.ts`
|`/user`|`user.ts`
|`/user/john`|`user/john.ts`

### Dynamic routes
Dynamic routes have path parameters with single brackets around them.
Parameters match any value *except* a slash.

`user/[name].ts` matches as follows.

|Request|Matches
|-|-|
|`user/2`|✓ yes -- `request.path.name` will be `"2"`|
|`user/john`|✓ yes -- `request.path.name` will be `"john"`|
|`user`|✗ no -- parameters must not be empty|
|`user/john/adams`|✗ no -- doesn't match `/` in `john/adams`|

### Rest routes
Rest routes have path parameters with single brackets and three dots.
Parameters match any value *including* a slash.

`user/[...name].ts` matches as follows.

|Request|Matches
|-|-|
|`user/2`|✓ yes -- `request.path.name` will be `"2"`|
|`user/john`|✓ yes -- `request.path.name` will be `"john"`|
|`user`|✗ no -- parameters must not be empty|
|`user/john/adams`|✓ yes -- `request.path.name` will be `"john/adams"`|

!!!
Due to their greedy nature which matches `/`, rest routes must appear at the
*end* of a route path.
!!!

### Optional routes
Optional routes have path parameters with double bracket. Parameters match any
value *except* a slash and may be empty.

`user/[[name]].ts` matches as follows.

|Request|Matches
|-|-|
|`user/2`|✓ yes -- `request.path.name` will be `"2"`|
|`user/john`|✓ yes -- `request.path.name` will be `"john"`|
|`user`|✓ yes -- `request.path.name` will be `undefined`|
|`user/john/adams`|✗ no -- doesn't match `/` in `john/adams`|

Optional parameters may only appear at the end of a route path.

### Optional rest routes
Optional rest routes have path parameters with double brackets and three dots.
Parameters match any value *including* a slash and may be empty.

`user/[[...name]].ts` matches as follows.

|Request|Matches
|-|-|
|`user/2`|✓ yes -- `request.path.name` will be `"2"`|
|`user/john`|✓ yes -- `request.path.name` will be `"john"`|
|`user`|✓ yes -- `request.path.name` will be `undefined`|
|`user/john/adams`|✓ yes -- `request.path.name` will be `"john/adams"`|

## Route handlers
Route files may contain one or more route handlers that match the request's
HTTP verb. Those handlers map requests to responses.

[s=routing/route-handlers]

### Disable body parsing

Route handlers are mappers from requests to responses. The passed-in request
facade contains a parsed version of the request body, depending on the given
content type. If you wish to have access to the unparsed request body, pass `{
parseBody: false }` to the options parameter.

[s=routing/route-handlers-unparsed-body]

This allows you to write routes that can pass their requests wholesale to
another backend.

## Layouts

## Guards

## Error pages
