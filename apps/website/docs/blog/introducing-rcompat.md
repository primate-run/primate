---
title: Introducing rcompat
epoch: 1712966964000
author: terrablue
---
Today we're officially introducing rcompat, a JavaScript interoperability
and runtime compatibility layer for servers which has been doing most of the
heavy lifting behind Primate and its multi-runtime support for a while now.

rcompat is a unified interface for [Node](https://nodejs.org/),
[Deno](https://deno.com/) and [Bun](https://bun.sh/). You can think of
rcompat as a server-side counterpart to jQuery.

## Native speed gains

While tools like Bun strive to be fully compatible with Node's built-in modules
and NPM, with Deno also moving in that direction, those backwards
compatibilities carry a lot of cruft and in the end, you're just using another
runtime to run code written for Node, without taking advantage of the inherent
speed gains that modern APIs introduce. rcompat abstracts that away for you.
You write code once and, wherever possible, it will take advantage of *native*
APIs. This allows you not only to run the same code with different runtimes,
but also speed it up if you choose Bun or Deno over Node during production. You
can easily switch between the runtimes, testing stability vs. modern features,
finding the best runtime for a given app.

## Forward compatibility

rcompat offers forward compatibility in the sense that it can add support for
new runtimes as they emerge *even* on minor updates (as this isn't considered
breaking existing code), allowing you to run old code that was written with
rcompat by newer runtimes. No other server-side interoperability layer for
JavaScript offers this kind of flexibility.

## Batteries included

rcompat is designed with many submodules in mind, including `@rcompat/fs` for
filesystem operations, `@rcompat/http` for using a modern HTTP server working
with WHATWG `Request`/`Response` (which Node doesn't support; rcompat wraps
a Node request object into a WHATWG `Request` as it comes in),
`@rcompat/invariant` for ensuring runtime invariants, `@rcompat/object` for
object transformations, and many more useful modules and abstractions.

The standard library is designed to accommodate modern development needs: for
example, `@rcompat/http` supports WebSockets (natively on Deno/Bun, and using
NPM's `ws` on Node), while `@rcompat/fs/file` offers globbing, listing and
manipulation of files, similarly to Python's `pathlib`.

For example, to set up a server with rcompat, use `@rcompat/http/serve` -- the
server-side equivalent of `fetch`.

```js
import serve from "@rcompat/http/serve";

serve(request => new Response("Hi!"), { host: "localhost", port: 6161 });
```

This code runs successfully with either `node app.js` (if you set your
package.json to `{ "type": "module" }`; otherwise use `app.mjs`),
`deno run -A app.js` or `bun --bun app.js`, taking advantage of native
optimizations.

## Another standard library?

The JavaScript ecosystem is replete with standard libraries. To take the
example of filesystem access, Node has at least three ways of accessing the
filesystem (sync, callbacks, promises), and then there's Deno's own filesystem
APIs, while Bun has its APIs too. Those all have their pros and cons, and if
you want to target all of them, you're going to have to write a lot of
branching code. rcompat is an abstraction over that, as it plays the role of
both a standard library *and* a runtime compatibility layer -- write once,
target everything.

For example, here's how you can read a file and parse it as JSON.

```js
import file from "@rcompat/fs/file";

console.log(await file("./users.json").json());
```

Again, this code runs successfully on Node, Deno or Bun, taking advantage of
optimizations native to every runtime.

## Evolving standard — input needed

rcompat has been quietly developed the last few months in conjunction with
Primate's development and is largely influenced by its needs. We'd like to
invite more participation by other projects / individuals in order to converge
on APIs that best serve everyone and are the most useful on a broad basis.

To illustrate this, Primate 0.31 will be using `@rcompat/fs/router`'s upcoming
`Router` class, which is meant to be used by frameworks using
filesystem-routing (such as Primate, Next, SvelteKit, etc.) to resolve requests
to routes. The design is aimed to be generic, but undoubtedly will be
influenced by Primate's needs. External feedback will help keep it useful for
other frameworks as well. Once `Router` is ready, we will also aim to upstream
our ideas to Bun's native [FileSystemRouter][FileSystemRouter] class such that
rcompat can delegate to it natively on Bun.

## Participation

You are cordially invited to take part in rcompat's development at
https://github.com/rcompat/rcompat. We will be setting up a documentation
website in the foreseeable future, and until then, the source code is the best
form of documentation.

rcompat is MIT licensed.

## Fin

If you like Primate, consider [joining our channel #primate][irc] on
irc.libera.chat. This channel is currently also used for rcompat's development,
until the need for a separate channel arises.

[irc]: https://web.libera.chat#primate
[FileSystemRouter]: https://bun.sh/docs/api/file-system-router
