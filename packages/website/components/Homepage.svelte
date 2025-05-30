<script>
  import { onMount } from "svelte";
  import Header from "./Header.svelte";
  import Icon from "./Icon.svelte";

  export let content, app, examples;

  const title = "Web framework focused on flexibility and developer freedom";
  const { theme } = app;
  const filenames = {
    react: ["PostIndex", "jsx"],
    solid: ["PostIndex", "jsx"],
    svelte: ["PostIndex", "svelte"],
    vue: ["PostIndex", "vue"],
    angular: ["post-index", "component.ts"],
    htmx: ["post-index", "htmx"],
    webc: ["post-index", "webc"]
  };

  const modify_route = ([name, ending]) => {
    const selector = "code .line > span";
    [...globalThis.document.querySelector(".tabs").querySelectorAll(selector)]
      .filter(string => string.innerText.slice(1).includes("ndex."))
      .forEach(string => {
        string.innerText = `${name}.${ending}`;
      });
  };

  const clipboard = text => {
    globalThis.navigator.clipboard.writeText(text);
  };

  onMount(() => {
    globalThis.document.querySelectorAll(".tabbed").forEach(tabbed => {
      const captions = tabbed.querySelector(".captions").childNodes;
      const tabs = tabbed.querySelector(".tabs").childNodes;
      captions.forEach((caption, i) => {
        caption.addEventListener("click", () => {
          const filename = filenames[caption.innerText.toLowerCase()];
          filename && modify_route(filename);

          captions.forEach((_caption, j)  => {
            if (i === j) {
              _caption.classList.add("active");
            } else {
              _caption.classList.remove("active");
            }
          });
          tabs.forEach((tab, j)  => {
            if (i === j) {
              tab.classList.remove("hidden");
            } else {
              tab.classList.add("hidden");
            }
          });
        });
      });
    });
  });
</script>
<Header {app} {title} />
<main class="hero">
  <div class="header">
    <div class="flank"></div>
    <div class="middle">
      <div>
        <img src="/logo.svg" style="width: 46px;" />
      </div>
      <div>
        <h1>primate</h1>
        <h2 class="heading">{title}</h2>
        <div class="buttons">
          <a href="/guide/getting-started" class="primary">read guide</a>
          <span class="clip" on:click={() => clipboard("npm create primate")}>
            <button>$ npm create primate</button>
            <Icon name="clipboard" />
          </span>
        </div>
      </div>
    </div>
    <div class="flank"></div>
  </div>
  <h1 class="interim-title">Mix and match the best web tech, in one stack</h1>
  <div class="table">
    <div>
      <h1>backend</h1>
      <div class="logos">
        <img src="/logos/js.svg" title="JavaScript" />
        <img src="/logos/ts.svg" title="TypeScript" />
        <img src="/logos/go.svg" title="Golang" />
        <img src="/logos/python.svg" title="Python" />
        <img src="/logos/ruby.svg" title="Ruby" />
      </div>
      <p>
        Write backend code in your language of choice, leveraging the power of
        Wasm. Mix routes of <a href="/modules/backend">different backend
          languages</a>, allowing your application to be written by different
        teams.
      </p>
      {@html examples.backend}
    </div>
    <div>
      <h1>frontend</h1>
      <div class="logos">
        <img src="/logos/react.svg" title="React" />
        <img src="/logos/svelte.svg" title="Svelte" />
        <img src="/logos/vue.svg" title="Vue" />
        <img src="/logos/solid.svg" title="Solid" />
        <img src="/logos/angular.svg" title="Angular" />
        <img src="/logos/webc.svg" title="Web Components" class="invertible" />
      </div>
      <p>
        Seamlessly switch between <a href="/modules/frontend">frontend
          frameworks</a>, with support for SSR, hydration and layouts across
        the board. You can even combine more than one framework in your
        application.
      </p>
      {@html examples.frontend}
    </div>
    <div>
      <h1>runtime</h1>
      <div class="logos">
        <img src="/logos/node.svg" title="Node" />
        <img src="/logos/deno.svg" title="Deno" class="invertible" />
        <img src="/logos/bun.svg" title="Bun" />
      </div>
      <p>
        Compare the performance of your application across different JavaScript
        runtimes. Use the comfort of one runtime during development and the
        speed gains of another in production.
      </p>
      {@html examples.runtime}
    </div>
  </div>
  <h1 class="interim-title">extensive, officially supported ecosystem</h1>
  <div class="table">
    <div>
      <h1>data handling</h1>
      <div class="logos">
        <img src="/logos/sqlite.svg" title="SQLite" />
        <img src="/logos/postgresql.svg" title="PostgreSQL" />
        <img src="/logos/mysql.svg" title="MySQL" />
        <img src="/logos/mongodb.svg" title="MongoDB" />
        <img src="/logos/surrealdb.svg" title="SurrealDB" />
      </div>
      <p>Validate input using Primate <a href="/modules/schema">schemas</a>.
        Persist information with <a href="/modules/store">stores</a>,
        using any of the supported <a href="/modules/drivers">database drivers</a>
        with a unified ORM interface, or write your own optimized, low-level
        store actions. Primate's ORM comes with automated transaction management and
        rollback on error, saving you writing boilerplate code in your
        application routes.
      </p>
    </div>
    <div>
      <h1>internationalization</h1>
      <div class="logos">
        <img src="/logos/react.svg" title="React" />
        <img src="/logos/svelte.svg" title="Svelte" />
        <img src="/logos/solid.svg" title="Solid" />
      </div>
      <p>Easily make your application international, using a unified API across
      different frontends with placeholder support and a built-in language
      switcher.</p>
      {@html examples.i18n}
    </div>
    <div>
      <h1>all around</h1>
      <div class="logos">
        <img src="/logos/esbuild.svg" title="esbuild" />
      </div>
      <p>Use <a href="/modules/build">esbuild</a> for hot reload during
        development and bundling in production, add
        <a href="/guide/sessions">user sessions</a> or
        <a href="/guide/extending-primate">write your own modules</a> using the
        available hooks.
      </p>
    </div>
  </div>
  <h1 class="interim-title">more than all the rest, combined</h1>
  <div class="comparison">
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Next</th>
          <th>Nuxt</th>
          <th>SvelteKit</th>
          <th>Analog</th>
          <th>Primate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="6">
            Backend
          </td>
        </tr>
        <tr>
          <td>JavaScript</td>
          <td>✓</td>
          <td>✓</td>
          <td>✓</td>
          <td>✗</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>TypeScript</td>
          <td>✓</td>
          <td>✓</td>
          <td>✓</td>
          <td>✓</td>
          <td>
            <a href="/modules/typescript">✓</a>
          </td>
        </tr>
        <tr>
          <td>Go</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/go">✓</a>
          </td>
        </tr>
        <tr>
          <td>Python</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/python">✓</a>
          </td>
        </tr>
        <tr>
          <td>Ruby</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/ruby">✓</a>
          </td>
        </tr>
        <tr>
          <td colspan="6">
            Frontend
          </td>
        </tr>
        <tr>
          <td>React</td>
          <td>✓</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/react">✓</a>
          </td>
        </tr>
        <tr>
          <td>Vue</td>
          <td>✗</td>
          <td>✓</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/vue">✓</a>
          </td>
        </tr>
        <tr>
          <td>Svelte</td>
          <td>✗</td>
          <td>✗</td>
          <td>✓</td>
          <td>✗</td>
          <td>
            <a href="/modules/svelte">✓</a>
          </td>
        </tr>
        <tr>
          <td>Angular</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✓</td>
          <td>
            <a href="/modules/angular">✓</a>
          </td>
        </tr>
        <tr>
          <td>Solid</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/solid">✓</a>
          </td>
        </tr>
        <tr>
          <td>Web Components</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/web-components">✓</a>
          </td>
        </tr>
        <tr>
          <td>HTML</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/html">✓</a>
          </td>
        </tr>
        <tr>
          <td>HTMX</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/htmx">✓</a>
          </td>
        </tr>
        <tr>
          <td>Handlebars</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/handlebars">✓</a>
          </td>
        </tr>
        <tr>
          <td>Markdown</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/markdown">✓</a>
          </td>
        </tr>
        <tr>
          <td>Marko</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/marko">✓</a>
          </td>
        </tr>
        <tr>
          <td>Eta</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/eta">✓</a>
          </td>
        </tr>
        <tr>
          <td>Voby</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>
            <a href="/modules/voby">✓</a>
          </td>
        </tr>
        <tr>
          <td colspan="6">
            Native runtime
          </td>
        </tr>
        <tr>
          <td>Node</td>
          <td>✓</td>
          <td>✓</td>
          <td>✓</td>
          <td>✓</td>
          <td>✓</td>
        <tr>
          <td>Deno</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✓</td>
        </tr>
        <tr>
          <td>Bun</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✓</td>
        </tr>
        <tr>
          <td colspan="6">
            Data stores / ORM
          </td>
        </tr>
        <tr>
          <td>SQLite</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/modules/drivers#sqlite">✓</a></td>
        </tr>
        <tr>
          <td>MongoDB</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/modules/drivers#mongodb">✓</a></td>
        </tr>
        <tr>
          <td>PostgreSQL</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/modules/drivers#postgresql">✓</a></td>
        </tr>
        <tr>
          <td>MySQL</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/modules/drivers#mysql">✓</a></td>
        </tr>
        <tr>
          <td>SurrealDB</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/modules/drivers#surrealdb">✓</a></td>
        </tr>
        <tr>
          <td colspan="6">
            Ecosystem
          </td>
        </tr>
        <tr>
          <td>I18N</td>
          <td>✓</td>
          <td>✓</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/modules/i18n">✓</a></td>
        </tr>
        <tr>
          <td>Head Component</td>
          <td>✓</td>
          <td>✓</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/modules/frontend#head-component">✓</a></td>
        </tr>
        <tr>
          <td>Route guards</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/guide/guards">✓</a></td>
        </tr>
        <tr>
          <td>Recursive layouts</td>
          <td>✓</td>
          <td>✓</td>
          <td>✓</td>
          <td>✗</td>
          <td><a href="/guide/layouts">✓</a></td>
        </tr>
        <tr>
          <td>WebSockets</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/guide/responses#websocket">✓</a></td>
        </tr>
        <tr>
          <td>Server-sent events</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/guide/responses#server-sent-events">✓</a></td>
        </tr>
        <tr>
          <td>User sessions</td>
          <td>✗</td>
          <td>✓</td>
          <td>✗</td>
          <td>✗</td>
          <td><a href="/guide/sessions">✓</a></td>
        </tr>
      </tbody>
    </table>
  </div>


  <div class="footer">
    <div class="table">
      <div>
        <img src="/logo.svg" />
      </div>
      <div>
        <div class="heading">docs</div>
        <ul>
          <li><a href="/guide/getting-started">guide</a></li>
          <li><a href="/modules/official">modules</a></li>
          <li><a href="/blog">blog</a></li>
        </ul>
      </div>
      <div>
        <div class="heading">community</div>
        <ul>
          <li><a href="{theme.chat}">discord</a></li>
          <li><a href="https://x.com/{theme.x}">x</a></li>
          <li><a href="https://github.com/{theme.github}">github</a></li>
        </ul>
      </div>
    </div>
  </div>
</main>
