# What is Primate?

Primate is the universal web framework for building full-stack applications.

Unlike other frameworks, it doesn't lock you into one particular stack,
and instead allows you to freely combine frontends, backends, databases and
runtimes into a mix that works best for you.

It's the *last* web framework you'll ever need.

## Universal framework

[s=intro/frontend]

As a web developer, you're *beset* with frameworks. There is a reason framework
fatique is an actual term. And offering you *yet another* framework is not
making it any better.

But to the extent that you're tired of everyone making a framework, Primate is
a gust of fresh air. Because its goal is no less than making other full-stack
web frameworks obsolete, by design.

For almost every frontend out there, some very smart people thought it necessary
to create a full-stack framework to accompany it. For React, you have NextJS.
For Vue, Nuxt. Svelte has Sveltekit. And Angular is somehow both a frontend and
a full-stack framework at the same time. No one knows why.

Those full-stack frameworks, also often called meta-frameworks, are similar in
some aspects, and differ in others. It seems that for whatever frontend you've
chosen to use, you're bound to be vendor-locked into a full-stack monstrosity.
And if some day, you've decided you want to move on to another frontend -- well,
tough luck, because your backend code is only good for one thing.

Primate puts an end to this. You can use your [favorite frontend](/frontend)
with a backend that's *universal* and works the same way with every frontend. You can
even combine different frontends -- writing different parts of your application
in different frameworks, or slowly migrating your code to another frontend.

## The power of Wasm

[s=intro/backend]

Primate not only allows you to freely exchange
-- and combine -- frontends, it does the same on the backend, with the kind
help of Web Assembly.

You can write backend code in different languages, not just TypeScript or
JavaScript. And this code will be compiled to a specialized binary format called
Web Assembly (Wasm), and in runtime power your backend. This means that if
you're a developer coming from a different background than JavaScript, and you
*still* want to enjoy access to all those frontends and keep authoring
backends in your favourite language, you now can.

You're not forced to work with JavaScript on the backend just because virtually
all modern frontend frameworks are written in JavaScript. And here too, you're
free to combine between the [different backends](/backend) in your application.

## Runtime agnostic

[s=intro/runtime]

Primate is not only frontend and backend agnostic, it also works on every major
runtime -- Node, Deno and Bun. And by working, we don't just mean that you can
use Bun's or Deno's Node compatibility layer to run your code. We mean that
whatever runtime you use, Primate will leverage its *native*, *fastest*
[execution paths](/runtime) to give you the best experience.

Due to the way it is written, Primate is designed to quickly support and work
on future, emergent runtimes as well. Code that you write now will be
forward-compatible with future runtimes, as they arise.

## Full baggage

Which is another way to say, *batteries included*. Primate comes with a set of
packages -- all under the `@primate` namespace -- that extend the core
framework. Database with ORMs, session management, I18N, and even the ability
to build your app natively -- for desktop, are officially supported.
