<script>
  import { onMount } from "svelte";
  import Icons from "#component/Icons";
  import Icon from "#component/Icon";

  export let app, title;

  const { theme } = app;
  const part = (link) => link.split("/")[1];
  const toggleColorScheme = () =>
    colorscheme.update((value) => (value === "dark" ? "light" : "dark"));

  let highlight = (_) => "";
  let colorscheme;

  const clipboard = (text) => {
    globalThis.navigator.clipboard.writeText(text);
  };

  async function updated() {
    if (globalThis.document === undefined) return; // server
    colorscheme = (await import("#static/localStorage.ts")).default;
    colorscheme.subscribe((value) => {
      updateThemeColor(value === "dark" ? "#161616" : "#ffffff");
    });

    highlight = (link) =>
      part(link) === part(globalThis.window.location.pathname) ? "active" : "";

    globalThis.document.querySelectorAll(".copy").forEach((snippet) => {
      snippet.addEventListener("click", (event) => {
        const to_clipboard = event.target.closest(".to-clipboard");
        const content = to_clipboard.nextElementSibling.textContent;
        clipboard(content.startsWith("$ ") ? content.slice(2) : content);
        to_clipboard.classList.add("copied");
        setTimeout(() => {
          to_clipboard.classList.remove("copied");
        }, 2000);
      });
    });

    globalThis.document.querySelectorAll(".tabbed").forEach((tabbed) => {
      const captions = tabbed.querySelector(".captions").childNodes;
      const tabs = tabbed.querySelector(".tabs").childNodes;
      const filenames = tabbed.querySelector(".filenames")?.childNodes;

      captions.forEach((caption, i) => {
        caption.addEventListener("click", () => {
          captions.forEach((_caption, j) => {
            if (i === j) {
              _caption.classList.add("active");
            } else {
              _caption.classList.remove("active");
            }
          });
          filenames?.forEach((item, j) => {
            if (i === j) {
              item.classList.add("active");
            } else {
              item.classList.remove("active");
            }
          });
          tabs.forEach((tab, j) => {
            if (i === j) {
              tab.classList.remove("hidden");
            } else {
              tab.classList.add("hidden");
            }
          });
        });
      });
    });
  }

  function updateThemeColor(color) {
    let meta = document.querySelector("meta[name='theme-color']");
    if (meta) {
      meta.setAttribute("content", color);
    }
  }

  onMount(() => {
    updated();
    globalThis.addEventListener("updated", updated);
    return () => globalThis.removeEventListener("updated", updated);
  });
</script>

<svelte:head>
  <title>Primate — {title}</title>
  <meta name="description" content={`The universal web framework — ${title}`} />
</svelte:head>
<Icons />
<header>
  <a class="home" href="/">
    <img src="/logo.svg" alt="Primate Logo" />
    <span>Primate</span>
  </a>

  <div class="search"></div>

  <ul class="navbar">
    {#each theme.navbar as { link, label }}
      <li>
        <a href={link} class={highlight(link)}>{label}</a>
      </li>
    {/each}

    <div class="divider" />

    <button class="ic" on:click={toggleColorScheme}>
      <Icon name={$colorscheme === "dark" ? "sun" : "moon"} />
    </button>

    {#each theme.links as link}
      <a class="ic" href={link.href}>
        <Icon name={link.icon} />
      </a>
    {/each}
  </ul>
</header>
