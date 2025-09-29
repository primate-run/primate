# Routing
Routing in Primate maps incoming HTTP requests to backend logic. Primate uses
**filesystem-based routing**: it breaks down the request **path** and maps it
to a file in `routes`.

## Filesystem-based routing
In filesystem-based routing, files map directly to URL paths.
- `/` matches `routes/index.ts`
- `/user` matches `routes/user.ts`
- `/user/profile` matches `routes/user/profile.ts`

Route files may contain **path parameters** denoted with brackets. Resolved
parameters are available to [route handlers](#route-handlers) as `request.path`.

| Request path       | Route file              | `*` matches            |
|--------------------|-------------------------|------------------------|
| `/`                | [index.ts]              |                        |
| `/user`            | [user.ts]               |                        |
| `/user/*`          | [user/\[id\].ts]        | anything except `/`    |
| `/user/*`          | [user/\[...id\].ts]     | anything including `/` |
| `/user`, `/user/*` | [user/\[\[id\]\].ts]    | anything except `/`    |
| `/user`, `/user/*` | [user/\[\[...id\]\].ts] | anything including `/` |

[index.ts]: #static-routes
[user.ts]: #static-routes
[user/\[id\].ts]: #dynamic-routes
[user/\[...id\].ts]: #rest-routes
[user/\[\[id\]\].ts]: #optional-routes
[user/\[\[...id\]\].ts]: #optional-rest-routes

!!!
Path parameters are URL-decoded. Greedy segments (`[...name]`) match across `/`
and must be the **final** segment of a route path.
!!!

## Path normalization
Primate cleans up URLs before matching to make them consistent (e.g.,
collapsing slashes, ignoring trailing ones).

| Request path | Normalized to | Why |
|------------------|---------------|-----|
| `/` | `/` | Root is special |
| `/user/` | `/user` | Ignores trailing slash |
| `/user//profile` | `/user/profile` | Collapses multiple slashes |
| `/docs/index` | `/docs` | Treats explicit 'index' as parent |

!!!
Normalization doesn't decode parameters — that happens during matching if a
dynamic route captures them.
!!!

## Route resolution
Primate matches the normalized path to files by traversing segments like a
folder tree, prioritizing exact matches for predictability.

- **Split into segments** — `/user/profile` becomes `["user", "profile"]`.
- **Match step by step**
   - **Static first** — Exact file or directory names (`user.ts`).
   - **Then dynamic** — `[param].ts` or `[[param]].ts` for one segment.
   - **Rest if last** — `[...param].ts` or `[[...param]].ts` for the remainder.
- **Optional fallback** — If no exact match at the end, try an optional param
   with an empty value.

This ensures static > required > optional. If nothing matches, it's a 404.

### Rules for clean setups
Primate checks for ambiguities at startup and errors out if found.
- **One dynamic per level** — Can't mix single (`[id]`) and rest (`[...id]`)
  under the same dir.
- **No overlaps** — Avoid `a.ts` + `a/index.ts`, or static + same-level
  optional (e.g., `user.ts` + `user/[[id]].ts`).
- **Endpoints only** — Optionals and rests can't have subfiles; they're leaves.

| Defined routes | Request | Resolved file | Notes |
|--------------------------------------------------|--------------------|--------------------------------------|-------|
| `routes/user.ts` | `/user` | `routes/user.ts` | Static wins |
| `routes/user/[id].ts` | `/user/42` | `routes/user/[id].ts` | Captures one |
| `routes/user/[...name].ts` | `/user/john/adams` | `routes/user/[...name].ts` | Captures rest |
| `routes/[[id]].ts` (no index.ts) | `/` | `routes/[[id]].ts` | Empty optional |
| `routes/docs.ts` | `/docs/index` | `routes/docs.ts` | Normalization |
| `routes/a/[id].ts` + `routes/a/[...rest].ts` | — | ✗ | Dynamics conflict |
| `routes/user.ts` + `routes/user/[[id]].ts` | — | ✗ | Static shadows optional |
| `routes/a.ts` + `routes/a/index.ts` | — | ✗ | Overlap |

## Static routes
Static routes have the highest priority in route resolution.

| Request path | Route file     |
|--------------|----------------|
| `/`          | `index.ts`     |
| `/user`      | `user.ts`      |
| `/user/john` | `user/john.ts` |

!!!
You can also represent a route with an `index.ts` file inside a directory
(e.g., `routes/user/index.ts` for `/user`). This is equivalent to `user.ts` —
pick one style per route. Using directories with `index.ts` is handy for
grouping routes to add [special files](#special-files) like layouts or guards.
!!!

## Dynamic routes
Dynamic routes use single brackets for a single segment. The parameter matches
any value **except** `/`.

`routes/user/[name].ts` matches:

| Request path       | Matches |
|--------------------|---------|
| `/user/2`          | ✓ `request.path.get("name")` is `"2"` |
| `/user/john`       | ✓ `request.path.get("name")` is `"john"` |
| `/user`            | ✗ parameter required |
| `/user/john/adams` | ✗ doesn't match `/` |

## Rest routes
Rest routes use single brackets with three dots. The parameter matches any
value **including** `/`.

`routes/user/[...name].ts` matches:

| Request path       | Matches |
|--------------------|---------|
| `/user/2`          | ✓ `request.path.get("name")` is `"2"` |
| `/user/john`       | ✓ `request.path.get("name")` is `"john"` |
| `/user`            | ✗ parameter required |
| `/user/john/adams` | ✓ `request.path.get("name")` is `"john/adams"` |

!!!
Because they match across `/`, **rest segments must be the final segment** of a
route path.
!!!

## Optional routes
Optional routes use **double brackets**. The parameter matches any value
**except** `/` and **can be empty** (i.e., absent).

`routes/user/[[name]].ts` matches:

| Request path       | Matches |
|--------------------|---------|
| `/user/2`          | ✓ `request.path.try("name")` is `"2"` |
| `/user/john`       | ✓ `request.path.try("name")` is `"john"` |
| `/user`            | ✓ `request.path.try("name")` is `undefined` |
| `/user/john/adams` | ✗ doesn't match `/` |

Optional parameters may only appear at the **end** of a route path.

!!!
For optional segments, prefer `.try("key")` (or a schema default).
`.get("key")` throws when the parameter is absent.
!!!

## Optional rest routes
Optional rest routes use **double brackets with three dots**. The parameter
matches any value **including** `/` and **can be empty**.

`routes/user/[[...name]].ts` matches:

| Request path       | Matches |
|--------------------|---------|
| `/user/2`          | ✓ `request.path.try("name")` is `"2"` |
| `/user/john`       | ✓ `request.path.try("name")` is `"john"` |
| `/user`            | ✓ `request.path.try("name")` is `undefined` |
| `/user/john/adams` | ✓ `request.path.try("name")` is `"john/adams"` |

## Route handlers
Route files may contain one or more route handlers that match the request's
HTTP verb. Handlers map requests to responses.

[s=routing/route-handlers]

### Disable body parsing
Handlers receive a parsed request body based on `Content-Type`. To keep the
request body unparsed, pass `{ parseBody: false }` in the route options.

[s=routing/route-handlers-unparsed-body]

This lets you forward the incoming request as-is to another backend.

## Special files

Files whose names start with `+` are **special**: they do **not** map to HTTP
paths. Instead, they influence how routes in their directory (and below) behave.

| Special file              | Purpose                              | Recursive |
|---------------------------|--------------------------------------|-----------|
| [+layout.ts](#layouts)    | Wrap route output in a layout        | ✓         |
| [+guard.ts](#guards)      | Enforce a condition before running the route | ✓ |
| [+error.ts](#error-files) | Handle errors thrown by routes       | ✗         |

!!!
"Recursive" means the file affects the current directory **and all
subdirectories**. Special files don't map to paths and don't stack arbitrarily
— see each section for composition and precedence.
!!!

### Layouts
Layouts live in `+layout.ts` and **compose** from the route's directory upward.
The route's content is rendered into the **nearest** layout (same directory,
if present), which is then rendered into the next parent layout, and so on up
to `routes/`.

[s=routing/layouts/layout]

The rendered layout component must render the route content via a slot/children,
depending on your frontend.

[s=routing/layouts/frontend]

!!!
**Composition order**: the innermost layout (closest to the route) renders
first; each parent layout wraps it.
!!!

### Guards
Guards live in `+guard.ts`. A guard protects **all routes in its directory and
below**. Guards execute **top-down**: the highest parent guard runs first; if
it **passes**, the next guard down runs; finally the route runs.

* A guard **passes** only when it **explicitly returns** `null`.
* Any **non-null** return short-circuits the route and is used as the response
(e.g., redirect, error page, rendered view).
* Returning **undefined** or nothing at all is **not** a pass and results in an
error.

[s=routing/guards]

!!!
**Execution order**: parent guards run before child guards. The route runs only
if **every** applicable guard passes.
!!!

### Error files
Error files live in `+error.ts`. An error handler applies to its directory
**and all subdirectories**, but handlers do **not** compose: when an error is
thrown, the **nearest** `+error.ts` up the directory tree handles it. Only one
error handler runs.

[s=routing/errors]

!!!
**Precedence**: the closest `+error.ts` (same directory, then parent, etc.)
takes precedence. Unlike layouts and guards, error handlers aren't layered.
!!!
