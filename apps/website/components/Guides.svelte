<script>
  import ExampleLink from "#component/ExampleLink";

  export let guides;
</script>

<section class="examples">
  <div class="examples__bg"></div>
  <div class="examples__inner">
    <div class="examples__head">
      <h2 class="examples__title">Get productive.</h2>
      <p class="examples__lead">
        Short guides for common tasks. Browse topics and jump into the docs.
      </p>
    </div>

    <div class="example-groups">
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
  </div>
</section>

<style>
  section {
    border-bottom: 1px solid var(--border);
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
    text-align: center;
    margin-bottom: 10px;
  }
  .examples__lead {
    margin: 0;
    color: var(--fg2);
    font-size: 1.7rem;
    text-align: center;
    margin-bottom: 20px;
  }
  .example-groups {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem 3rem;
  }
  @media (max-width: 1100px) {
    .example-groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 720px) {
    .example-groups {
      grid-template-columns: 1fr;
    }
  }

  .example-group {
    min-width: 0;
  }
  .example-group__title {
    margin: 0 0 0.8rem;
    padding: 6px 10px;
    font-size: 14px;
    text-transform: uppercase;
    color: var(--fg);
    background: color-mix(in srgb, var(--fg) 7%, transparent);
    border-radius: 4px;
    font-weight: normal;
  }

  .example-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .example-list li {
    min-width: 0;
  }
</style>
