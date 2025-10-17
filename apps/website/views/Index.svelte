<script>
  import Header from "#component/Header";
  import Footer from "#component/Footer";
  import Icon from "#component/Icon";
  import Guides from "#component/Guides";

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
        Frontend, backend, runtime — Primate lets you pick the tools you love
        and <span class="emphasis">combine them however you like</span>, without
        lock-ins or rewrites.
      </div>

      <div class="hero__actions">
        <a class="button primary" href="/docs/quickstart">Get started</a>
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
        <p class="bento__lead">React, Angular, Vue, Svelte — side by side</p>
        <span class="bento__cta">
          Examples <Icon name="chevron-right" />
        </span>
      </a>

      <a class="bento__card" href="#backend">
        <h3 class="bento__title">Backends</h3>
        <p class="bento__lead">
          JavaScript/TypeScript routes, plus WebAssembly backends
        </p>
        <span class="bento__cta">
          Examples <Icon name="chevron-right" />
        </span>
      </a>

      <a class="bento__card" href="#runtime">
        <h3 class="bento__title">Runtimes</h3>
        <p class="bento__lead">
          Node, Deno, Bun — consistent APIs, native execution paths
        </p>
        <span class="bento__cta">
          Examples <Icon name="chevron-right" />
        </span>
      </a>

      <a class="bento__card" href="#ecosystem">
        <h3 class="bento__title">Ecosystem</h3>
        <p class="bento__lead">Databases, sessions, auth, i18n, native apps</p>
        <span class="bento__cta">
          Examples <Icon name="chevron-right" />
        </span>
      </a>
    </div>
  </section>

  <section id="frontend" class="feature">
    <div class="feature__inner">
      <div class="feature__head">
        <h2 class="feature__title">Use any frontend.</h2>
        <p class="feature__lead">
          Primate supports every major frontend. Split your app across
          frameworks, or migrate gradually without rewrites.
        </p>
        <div class="feature__actions">
          <a class="button" href="/docs/frontend">Docs</a>
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
          Write routes in JS/TS by default. Extend with WebAssembly backends and
          mix them freely. New backends are added based on demand.
        </p>
        <div class="feature__actions">
          <a class="button" href="/docs/backend">Docs</a>
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
          Consistent APIs on Node, Deno, and Bun — native execution paths under
          the hood, no runtime boilerplate.
        </p>
        <div class="feature__actions">
          <a class="button" href="/docs/platform">Docs</a>
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
          Official modules for real apps: databases, sessions, auth, i18n,
          native builds — with more coming.
        </p>
        <div class="feature__actions">
          <a class="button" href="/docs/database">Databases</a>
          <a class="button" href="/docs/i18n">i18n</a>
          <a class="button" href="/docs/sessions">Sessions</a>
          <a class="button" href="/docs/target/native">Native</a>
        </div>
      </div>
      <div class="feature__demo">{@html examples.i18n}</div>
    </div>
  </section>

  <Guides {guides} />

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
    max-width: 58ch;
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
    margin: 0 0 30px;
    max-width: 72ch;
  }

  .feature__actions {
    margin-top: 1.2rem;
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .feature__demo {
    grid-area: demo;
    background: #2e3440;
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
</style>
