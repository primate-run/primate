# Components

App frontend views are placed in `components`. To use components, install and
activate one or many of Primate's [frontend modules](/modules/frontend).

## Serving views

To serve views, install a frontend module, for example `@primate/html`.

```sh
npm install @primate/html
```

Active the module in your configuration.

```js
import html from "@primate/html";

export default {
  modules: [html()],
};
```

Create an HTML component in `components`.

```html caption=components/hello.html
<p>Hello, world!</p>
```

Serve it with the `view` handler, passing in the name of the file you just
created.

```js caption=routes/hello.js
import view from "primate/view";

export default {
  get() {
    return view("hello.html");
  },
};
```

The `view` handler will use the `pages/app.html` to render a full HTML page,
replacing `%body%` with the component's contents. If `pages/app.html` doesn't
exist, Primate will use its default fallback file.

```html caption=pages/app.html
<!doctype html>
<html>
  <head>
    <title>Primate app</title>
    <meta charset="utf-8" />
    %head%
  </head>
  <body>%body%</body>
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

It is sometimes necessary to serve a bare component without a fully-fledged
page, especially if you're replacing some parts of the page on the frontend
(say, using HTMX). To this end, you can use the `partial` option of the `view`
handler.

```js caption=routes/partial-hello.js
import view from "primate/view";

export default {
  get() {
    return view("hello.html", {}, { partial: true });
  },
};
```

Using the same `hello.html` component specified as above, a client requesting
`GET /partial-hello` will see the following response.

```html caption=response body at GET /partial-hello
<p>Hello, world!</p>
```
