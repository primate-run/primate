# Views

Frontend views are placed in `views`. To use views, add a
[frontend module](/docs/frontend).

## Serving views

To serve views, install a frontend module, for example `@primate/html`.

```sh
npm install @primate/html
```

Activate the module in your configuration.

```js
import html from "@primate/html";
import config from "primate/config";

export default config({
  modules: [html()],
});
```

Create an HTML view in `views`.

```html
<!-- views/hello.html -->
<p>Hello, world!</p>
```

Serve it in a route with `response.view`, passing in the name of the file you
just created.

```js
// routes/hello.js
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("hello.html"));
```

`response.view` will use the `pages/app.html` to render a full HTML page,
replacing `%body%` with the view's contents. If `pages/app.html` doesn't
exist, Primate will use its default fallback file.

```html
<!-- pages/app.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>Primate app</title>
    <meta charset="utf-8" />
    %head%
  </head>
  <body>
    %body%
  </body>
</html>
```

The combination of the route's output and the page will result in the following
HTML page served to a client requesting `GET /hello`.

```html
<html>
  <head>
    <title>Primate app</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <p>Hello, world!</p>
  </body>
</html>
```

## Partials

It is sometimes necessary to serve a bare view without a fully-fledged
page, especially if you're replacing some parts of the page on the frontend
(e.g., using HTMX). To this end, you can use the `partial` option of the `view`
handler.

```js
import response from "primate/response";
import route from "primate/route";

route.get(() => response.view("hello.html", {}, { partial: true }));
```

Using the same `hello.html` view specified as above, a client requesting
`GET /partial-hello` will see the following response.

```html
<p>Hello, world!</p>
```
