<footer>
  <nav>
    <a href="/docs">Docs</a>
    <a href="/guides">Guides</a>
    <a href="/blog">Blog</a>
    <a href="/chat">Community</a>
    <a href="https://x.com/primate_run">X</a>
    <a href="https://github.com/primate-run/primate">Source</a>
    <span class="license"
      >Primate is released under the <a
        href="https://github.com/primate-run/primate/blob/master/LICENSE"
        >MIT license</a
      >.
    </span>
  </nav>
</footer>

<style>
  footer {
    border-top: 1px solid var(--border);
    padding: 25px 0;
  }
  footer nav {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 var(--prs-page-padding-side);
    display: flex;
    gap: 1.4rem;
    flex-wrap: wrap;
    color: var(--heading);
  }
  footer nav a {
    color: var(--heading);
    text-decoration: none;
    border-bottom: 1px dashed transparent;
  }
  footer nav a:hover {
    border-bottom-color: var(--primary);
  }
  footer .license {
    flex-grow: 1;
    text-align: right;
  }
  footer .license a {
    color: var(--fg);
  }
</style>
