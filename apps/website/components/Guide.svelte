<script>
  import Header from "#component/Header";
  import Footer from "#component/Footer";

  export let content, meta, app, category;

  // split page into sections at <hr> or <hr/>
  const sections = content
    .split(/<hr>/i)
    .map((s) => s.trim())
    .filter(Boolean);

  // prose = from first <p…> to LAST </p>; rest is code
  function section(html) {
    const lower = html.toLowerCase();
    const start = lower.indexOf("<p"); // matches <p> or <p attr="...">
    const end = lower.lastIndexOf("</p>");

    if (start === -1 || end === -1 || end < start) {
      // fallback: treat all as prose
      return { prose: html, code: "", hasCode: false };
    }

    const proseEnd = end + "</p>".length;
    const prose = html.slice(0, proseEnd).trim();
    const code = html.slice(proseEnd).trim();
    return { prose, code, hasCode: code.length > 0 };
  }

  const parts = sections.map(section);
  const title = `${meta.name} | guide`;
</script>

<Header {app} {title} />

<main class="guide">
  <article>
    <span class="breadcrumbs">
      <a href="/guides">Guides</a> >
      <a href={`/guides/${category}`}>
        {`${category.charAt(0).toUpperCase()}${category.slice(1)}`}
      </a>
    </span>
    <h1 class="guide-title">
      {@html meta.name.replace(/`([^`]+)`/g, "<code>$1</code>")}
    </h1>

    <div class="guide-grid">
      {#each parts as parts}
        <section class="guide-row">
          <div class="col prose">
            <div class="guide-prose">{@html parts.prose}</div>
          </div>

          {#if parts.hasCode}
            <div class="col code">
              <div class="guide-code">{@html parts.code}</div>
            </div>
          {/if}
        </section>
      {/each}
    </div>
  </article>
</main>

<Footer />

<style>
  .guide .breadcrumbs a {
    text-decoration: none;
  }
  .guide h1 {
    margin-bottom: 10px;
    font-size: 30px;
  }

  .guide-grid {
    display: grid;
    gap: 35px;
  }

  .guide-row {
    display: grid;
    gap: 35px;
    grid-template-columns: 2fr 3fr;
    align-items: start;
  }

  .guide-row > :only-child {
    grid-column: 1 / -1;
  }

  @media (max-width: 960px) {
    .guide-row {
      grid-template-columns: 1fr;
    }
    /* optional: undo the span (not strictly needed, but tidy) */
    .guide-row > :only-child {
      grid-column: auto;
    }
  }
</style>
