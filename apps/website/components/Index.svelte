<script>
  import Header from "#component/Header";
  import ExampleLink from "#component/ExampleLink";
  import Footer from "#component/Footer";

  export let app;
  export let title = "The Universal Web Framework";
  export let examples = { frontend: "", backend: "", runtime: "", i18n: "" };
  export let guides;

  const initCmd = "npx primate init";
  let copied = false;
  async function copyInit() {
    try {
      await navigator.clipboard.writeText(initCmd);
      copied = true;
      setTimeout(() => (copied = false), 1200);
    } catch {}
  }
</script>

<Header {app} {title} />

<main class="homepage">
  <section class="hero">
    <div class="hero__bg"></div>

    <div class="hero__inner">
      <h1 class="hero__title">{title}</h1>
      <div class="hero__lead" style="line-height: 1.8em; margin-bottom: 7rem;">
        Frontend, backend, runtime — Primate lets you choose the tools that you
        love <br />and
        <span class="emphasis">combine them however you like</span>, without
        lock-ins or rewrites
      </div>

      <div class="hero__actions">
        <a class="button primary" href="/docs">Get started</a>
        <button class="button button--ghost" on:click={copyInit}>
          <span class="prompt">$ {initCmd}</span>
          <span class="pill">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  </section>

  <section class="bento">
    <div class="bento__inner">
      <a class="bento__card" href="#frontend">
        <h3 class="bento__title">Frontends</h3>
        <p class="bento__lead">
          Mix React, Svelte, Vue, Angular — in one app. If it compiles to the
          web, we support it.
        </p>
        <span class="bento__cta">See examples →</span>
      </a>

      <a class="bento__card" href="#backend">
        <h3 class="bento__title">Backends</h3>
        <p class="bento__lead">
          Courtesy of Wasm: write routes in JS/TS, Go, Ruby, Python. Use one —
          or all together.
        </p>
        <span class="bento__cta">See examples →</span>
      </a>

      <a class="bento__card" href="#runtime">
        <h3 class="bento__title">Runtimes</h3>
        <p class="bento__lead">
          Node, Deno, Bun and emerging runtimes with consistent APIs and fast
          native paths.
        </p>
        <span class="bento__cta">See examples →</span>
      </a>

      <a class="bento__card" href="#ecosystem">
        <h3 class="bento__title">Ecosystem</h3>
        <p class="bento__lead">
          Databases, ORM, sessions, auth, i18n, native builds — official modules
          that keep growing.
        </p>
        <span class="bento__cta">See examples →</span>
      </a>
    </div>
  </section>

  <section id="frontend" class="feature">
    <div class="feature__inner">
      <div class="feature__head">
        <h2 class="feature__title">Use any frontend.</h2>
        <p class="feature__lead">
          Primate supports every major frontend and many more lesser-known ones.
          Build different parts of your app in different frontends. Missing
          anything? Tell us and we'll add it.
        </p>
        <div class="feature__actions">
          <a class="button" href="/docs/frontend">Read docs</a>
        </div>
      </div>
      <div class="feature__demo">{@html examples.frontend}</div>
    </div>
  </section>

  <section id="backend" class="feature feature--alt">
    <div class="feature__inner">
      <div class="feature__head">
        <h2 class="feature__title">Combine many backends.</h2>
        <p class="feature__lead">
          Using Web Assembly, compose your backend in several languages — one or
          all at the same time. New backends are added according to demand.
        </p>
        <div class="feature__actions">
          <a class="button" href="/docs/backend">Read docs</a>
        </div>
      </div>
      <div class="feature__demo">{@html examples.backend}</div>
    </div>
  </section>

  <section id="runtime" class="feature">
    <div class="feature__inner">
      <div class="feature__head">
        <h2 class="feature__title">Choose your runtime.</h2>
        <p class="feature__lead">
          Consistent, nearly-universal support for Node, Deno, Bun and emergent
          runtimes. Fast native API paths under the hood — no runtime-specific
          boilerplate.
        </p>
        <div class="feature__actions">
          <a class="button" href="/docs/runtime">Read docs</a>
        </div>
      </div>
      <div class="feature__demo">{@html examples.runtime}</div>
    </div>
  </section>

  <section id="ecosystem" class="feature feature--alt">
    <div class="feature__inner">
      <div class="feature__head">
        <h2 class="feature__title">Extensive ecosystem.</h2>
        <p class="feature__lead">
          Official modules for what apps actually need — databases & ORM,
          sessions & auth, i18n, API clients, and more. We keep adding new
          modules.
        </p>
        <div class="feature__actions">
          <a class="button" href="/docs/databases">Databases</a>
          <a class="button" href="/docs/i18n">I18N</a>
          <a class="button" href="/docs/sessions">Sessions</a>
          <a class="button" href="/docs/native">Native apps</a>
        </div>
      </div>
      <div class="feature__demo">{@html examples.i18n}</div>
    </div>
  </section>

  <section id="learn" class="examples">
    <div class="examples__bg"></div>
    <div class="examples__inner">
      <div class="examples__head">
        <h2 class="examples__title">Get productive.</h2>
        <p class="examples__lead">
          Short, focused guides to common tasks. Browse the topics and jump into
          the docs.
        </p>
        <a class="examples__all" href="/guides">Browse all guides →</a>
      </div>
      {#each guides as category}
        <div class="example-group">
          <h3 class="example-group__title">{category[0]}</h3>
          <ul class="example-list">
            {#each category[1] as guide}
              <li>
                <ExampleLink
                  title={guide.name}
                  url={`${category[0]}/${guide.path}`}
                />
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </section>

  <Footer />
</main>

<style>
  section {
    border-bottom: 1px solid var(--border);
  }
  .emphasis {
    font-weight: bold;
    color: var(--fg);
  }
  main.homepage {
    display: block;
    padding-top: var(--height);
    max-width: none;
  }

  .hero {
    position: relative;
    padding: 96px 0 88px;
    overflow: hidden;
    isolation: isolate;
  }
  .hero__inner {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 var(--prs-page-padding-side);
    text-align: center;
    position: relative;
    z-index: 1;
  }
  .hero__title {
    font-size: clamp(3.2rem, 7vw, 6rem);
    margin: 5rem 0;
  }
  .hero__lead {
    max-width: 70ch;
    margin: 0 auto 2.4rem;
    color: var(--fg2);
    font-size: 1.9rem;
  }
  .hero__actions {
    display: inline-flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
  }
  .button {
    display: inline-flex;
    align-items: center;
    padding: 0.95rem 1.6rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--fg);
  }
  .button.primary {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
    font-size: 14px;
    padding: 7.5px 15px;
  }
  .button--ghost {
    font-family: droid-sans-mono;
  }
  .button .pill {
    font-size: 12px;
    background: color-mix(in srgb, var(--fg) 10%, transparent);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    font-family: inter;
    margin-left: 7.5px;
  }

  .hero__bg {
    position: absolute;
    top: 0;
    left: 50%;
    width: 100vw;
    height: 100%;
    transform: translateX(-50%);
    z-index: 0;
    --grid: color-mix(in srgb, var(--fg) 5%, transparent);
    background: radial-gradient(
        60rem 30rem at 20% 10%,
        color-mix(in srgb, var(--primary) 26%, transparent),
        transparent 60%
      ),
      radial-gradient(
        50rem 25rem at 80% 20%,
        color-mix(in srgb, var(--primary) 18%, transparent),
        transparent 60%
      ),
      repeating-linear-gradient(
        to right,
        var(--grid) 0 1px,
        transparent 1px 32px
      ),
      repeating-linear-gradient(
        to bottom,
        var(--grid) 0 1px,
        transparent 1px 32px
      );
  }

  .bento {
    position: relative;
    padding: 48px 0;
  }
  .bento__inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 var(--prs-page-padding-side);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 3rem;
  }
  .bento__card {
    display: grid;
    gap: 0.4rem;
    padding: 2rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: color-mix(in srgb, var(--caption-bg) 65%, transparent);
    text-decoration: none;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      background-color 0.2s ease;
  }
  .bento__card:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
    background: color-mix(in srgb, var(--caption-bg) 80%, transparent);
  }
  .bento__title {
    margin: 0;
    font-size: 20px;
    color: var(--fg);
  }
  .bento__lead {
    margin: 0;
    color: var(--fg2);
    font-size: 1.6rem;
  }
  .bento__cta {
    margin-top: 0.2rem;
    font-size: 1.3rem;
    color: var(--primary);
  }
  @media (max-width: 900px) {
    .bento__inner {
      grid-template-columns: 1fr;
    }
  }

  .feature {
    position: relative;
    padding: 72px 0;
    isolation: isolate;
  }
  .feature--alt {
    background: color-mix(in srgb, var(--caption-bg) 35%, transparent);
  }
  .feature__inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 var(--prs-page-padding-side);
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas: "text demo";
    gap: clamp(1.6rem, 4vw, 3.2rem);
    align-items: center;
  }
  .feature--alt .feature__inner {
    grid-template-areas: "demo text";
  }

  .feature__head {
    grid-area: text;
    max-width: 56ch;
    margin-bottom: 1rem;
  }
  .feature__title {
    font-size: clamp(2.8rem, 3.2vw + 1rem, 4.2rem);
    line-height: 1.1;
    margin: 0 0 3rem;
  }
  .feature__lead {
    color: var(--fg2);
    font-size: 1.8rem;
    margin: 0;
    max-width: 72ch;
    margin-bottom: 30px;
  }

  .feature__actions {
    margin-top: 1.2rem;
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .feature__demo {
    grid-area: demo;
    background: var(--caption-bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.2rem;
    overflow: hidden;
    box-shadow:
      0 1px 0 color-mix(in srgb, var(--fg) 8%, transparent),
      0 12px 30px color-mix(in srgb, var(--fg) 6%, transparent);
  }

  @media (max-width: 900px) {
    .hero {
      padding: 80px 0 72px;
    }
    .feature {
      padding: 56px 0;
    }
    .feature__inner {
      grid-template-columns: 1fr;
      grid-template-areas:
        "text"
        "demo";
    }
    .feature__demo {
      margin-top: 1.2rem;
    }
  }

  .examples {
    position: relative;
    padding: 72px 0;
    overflow: hidden;
    isolation: isolate;
  }
  .examples__bg {
    position: absolute;
    inset: -10% -10%;
    background: radial-gradient(
        60rem 30rem at 12% -8%,
        color-mix(in srgb, var(--primary) 26%, transparent),
        transparent 60%
      ),
      radial-gradient(
        44rem 22rem at 98% 18%,
        color-mix(in srgb, var(--primary) 18%, transparent),
        transparent 60%
      ),
      repeating-linear-gradient(
        to right,
        color-mix(in srgb, var(--fg) 5%, transparent) 0 1px,
        transparent 1px 28px
      ),
      repeating-linear-gradient(
        to bottom,
        color-mix(in srgb, var(--fg) 5%, transparent) 0 1px,
        transparent 1px 28px
      );
    filter: blur(48px);
    opacity: 0.1;
    pointer-events: none;
    z-index: 0;
  }
  .examples__inner {
    position: relative;
    z-index: 1;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 var(--prs-page-padding-side);
  }
  .examples__head {
    position: static;
    display: grid;
    gap: 0.6rem;
    margin-bottom: 1.6rem;
  }
  .examples__title {
    font-size: clamp(2.8rem, 3.2vw + 1rem, 4.2rem);
    line-height: 1.1;
    margin: 0;
  }
  .examples__lead {
    margin: 0;
    color: var(--fg2);
    font-size: 1.7rem;
    max-width: 72ch;
  }
  .examples__all {
    justify-self: start;
    margin-top: 0.6rem;
    font-size: 1.4rem;
    text-decoration: none;
    color: var(--primary);
    border-bottom: 1px dashed transparent;
  }
  .examples__all:hover {
    border-bottom-color: var(--primary);
  }

  .example-group {
    margin-top: 2.2rem;
  }
  .example-group__title {
    margin: 0 0 0.8rem;
    font-size: 1.2rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--heading);
  }
  .example-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 0.8rem;
  }
  .examples__soon {
    margin: 0.6rem 0 0;
    color: var(--fg2);
    font-style: italic;
  }
</style>
