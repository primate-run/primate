---
title: Release 0.28: TypeScript/Ruby routes, Web Components, uploading files
epoch: 1706390221000
author: terrablue
---
Today we're announcing the availability of the Primate 0.28 preview release.
This release introduces support for TypeScript and Ruby routes, a convenience
wrapper for Web Components, as well as support for uploading files.

!!!
If you're new to Primate, we recommend reading the [Getting started] page to
get an idea of it.
!!!

## TypeScript routes

TypeScript now joins our ever-growing list of supported backend languages.
While work on adding type definitions to Primate is ongoing, you can already
create and use TypeScript routes.

### Install

To add support for TypeScript, install the `@primate/typescript` module.

`npm install @primate/typescript`

### Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import typescript from "@primate/typescript";

export default {
  modules: [
    typescript(),
  ],
};
```

### Use

When writing routes, you can do everything you can do in JavaScript routes, in
TypeScript. To have your editor properly type your route functions, simply
import `Route` from Primate and add `satisfies Route` to your exported route
object.

```ts caption=routes/plain-text.ts
import { Route } from "primate";

export default {
  get() {
    return "Donald";
  },
} satisfies Route;
```

!!!
Using `satisfies Route` is optional and will only result in your editor showing
you proper completions.
!!!

## Ruby routes

Following up on our introduction of Python Wasm routes in 0.27, this release
extends the number of backend languages we support through Wasm to three by
adding Ruby support, adding up to a total of five supported backend languages.
Under the hood, we make use of the `ruby.wasm` project through WASI.

### Install

To add support for Ruby, install the `@primate/ruby` package.

`npm install @primate/ruby`

## Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import ruby from "@primate/ruby";

export default {
  modules: [
    ruby(),
  ],
};
```

### Use

When writing routes, you can pretty much do everything you can do in JavaScript
routes, in Ruby. For example, if you return strings or hashes from your Ruby
route, Primate will serve them as content type `text/plain` and
`application/json`, respectively.

```rb caption=routes/index.rb
def get(request)
  "Donald"
end

def post(request)
  { name: "Donald" }
end
```

If you send a GET request to `/`, you will see a plain text response of
`"Donald"`. For POST, you'll see a JSON response with `{"name": "Donald"}`.

In addition, much like with JavaScript routes, you have access to a `request`
object that exposes the same properties as in JavaScript.

For example, if a GET request is sent to `/?name=Donald`, it could be served by
the following route, returning the value of the query string parameter `name`
as plain text.

```rb caption=routes/index.rb
def get(request)
  # on GET /?name=Donald -> responds with text/plain "Donald"
  request.query.get("name")
end
```

For the full documentation of Ruby routes, see the
[Ruby module documentation].

### Future of WebAssembly in Primate

Our Ruby support is the first backend to use WASI. With Go, Python and Ruby
supported in Primate through WebAssembly, we are working on supporting
additional languages in Primate and improving existing API compatibility to
match that of JavaScript. As WASI matures and is supported by more environments,
we intend to move existing Wasm implementations to that.

If you have a particular language you wish to see supported in Primate routes,
please open an issue describing your use case.

## Web Components convenience wrapper

This releases introduces support for a web components wrapper using the file
extension `.webc`. Unlike other web component frameworks, this wrapper does not
introduce new syntax, but simply makes it easier for you to use web components
in your application, and in particular to pass props into them.

## Install

`npm install @primate/webc`

## Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import webc from "@primate/webc";

export default {
  modules: [
    webc(),
  ],
};
```

## Use

To create a web component, import `@primate/webc/Component` and create a
default export of class extending it. Implement the `render` function property
of that class, which returns a string representing the HTML code of this
component. Note that `Component` extends `HTMLElement`, and is thus a proper
web component for any purpose.

You can include subcomponents by importing and passing instances of them to the
rendered string. Either explicitly call their `.toString()` method or use a
structure which reduces them to strings.

You can use the `mounted` function proper of a `Component` instance to attach
event handlers after the component has been added to the DOM.

Create an web component in `components`.

```html caption=components/post-index.webc
<script>
import Component from "@primate/webc/Compontent";
import PostLink from "./post-link.webc";

export default class extends Component {
  mounted(root) {
    root
      .querySelector("h1")
      .addEventListener("click",
         _ => console.log("clicked!"));
  }

  render() {
    const { posts } = this.props;

    return `<h1>All posts</h1>
      ${posts
        .map(post =>
          new PostLink({ post }))
        .join("")
      }`;
  }
}
</script>
```

And another component for displaying post links.

```html caption=components/post-link.webc
<script>
  import Component from "@primate/webc/Component";

  export default class extends Component {
    render() {
      const { post } = this.props;
      return `<h2>
        <a href="/post/view/${post.id}">
          ${post.title}
        </a>
      </h2>`;
    }
  }
</script>
```

Create a route and serve the `post-index` component.

```js caption=routes/webc.js
import view from "primate/handler/view";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("post-index.webc",
      { posts });
  },
};
```

Your rendered web component will be accessible at http://localhost:6161/webc.

### Outlook

Our Web Components support is rapidly evolving, and we rely on feedback for
prioritizing work on it. In particular, we plan to extend the wrapper by
offering an `unmounted` property for cleanup before removal from the DOM, as
well as commonly used features in other frontends such as SSR and hydration.

## Uploading files

This release introduces support for uploading files in HTML forms using
`enctype="multipart/form-data"`. Files uploaded this way will be available as
`Blob` properties of the route function's `request.body`.

```html caption=components/file-upload.html
<form enctype="multipart/form-data" action="post">
  <p>
    <div><label>Title</label></div>
    <input name="title" />
  </p>
  <p>
    <div><label>Text</label></div>
    <textarea name="text"></textarea>
  </p>
  <p>
    <div><label>Attachment</label></div>
    <input type="file" name="attachment" required />
  </p>
  <input type="submit" value="Send form" />
</form>
```

Given the above form and the following route, `request.body` will contain three
fields: `title` and `text`, both strings, and `attachment`, a blob.

```js caption=routes/file-upload.js
import view from "primate/handler/view";

export default {
  get() {
    return view("file-upload.html");
  },
  async post({ body }) {
     return body.attachment;
  },
};
```

As `Blob` instances are streamable in Primate, submitting the form would result
in the uploaded file being sent back to the client as
`application/octet-stream`.

## Other changes

Consult the [full changelog][changelog] for a list of all relevant changes.

## Next on the road

Some of the things we plan to tackle in the upcoming weeks are,

* Add projections and relations to stores
* Multidriver transactions
* Add a `command` hook that would allow modules to register command line
  namespaces, to be able to run `npx primate [namespace] [command] [flags]`
* Use this new hook to create database migrations for SQL-flavored databases
* Add hydration and liveview support for `@primate/vue`
* Flesh out stores with default values, additional predicates and relations
  between tables/collections
* Add more type variants

This list isn't exhaustive or binding. None, some or all of these features may
be included in 0.29, and other features may be prioritized according to
feedback.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat.

Otherwise, have a blast with the new version!

[Getting started]: /guide/getting-started
[irc]: https://web.libera.chat#primate
[changelog]: https://github.com/primate-run/primate/releases/tag/0.28.0
[Ruby module documentation]: /modules/ruby
