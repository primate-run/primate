<script>
  import SidebarSection from "#component/SidebarSection";
  import { onMount } from "svelte";

  export let sidebar, toc, path;

  let teardown = () => {};

  async function updated() {
    // clean previous wiring (if any)
    teardown();

    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) {
      teardown = () => {};
      return;
    }

    // map sidebar hashes -> <li>, only if the target exists in the page
    const links = Array.from(sidebar.querySelectorAll("li a[href*='#']"));
    const idToLi = new Map();

    for (const a of links) {
      const href = a.getAttribute("href") || "";
      const i = href.indexOf("#");
      if (i < 0) continue;
      const id = decodeURIComponent(href.slice(i + 1));
      const el = document.getElementById(id);
      if (el) idToLi.set(id, a.parentElement);
    }
    if (!idToLi.size) {
      teardown = () => {};
      return;
    }

    // single active at a time
    let current = null;
    const setActive = (id) => {
      if (current === id) return;
      idToLi.forEach((li) => li.classList.remove("active"));
      current = id || null;
      if (current) idToLi.get(current)?.classList.add("active");
    };

    // IO: when a heading enters the "active band", it becomes active.
    const headerPx =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--height"),
      ) || 60;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && idToLi.has(e.target.id)) {
            setActive(e.target.id); // last entering wins; we don't clear on leave
          }
        }
      },
      {
        rootMargin: `${-(headerPx + 16)}px 0px -70% 0px`,
        threshold: 0,
      },
    );

    idToLi.forEach((_li, id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    // Make clicks feel instant (same-hash clicks may not trigger IO immediately)
    const onClick = (ev) => {
      const a = ev.target.closest?.("a");
      if (!a || !a.hash) return;
      const id = decodeURIComponent(a.hash.slice(1));
      if (idToLi.has(id)) requestAnimationFrame(() => setActive(id));
    };
    sidebar.addEventListener("click", onClick);

    // Initial: honor current hash, else first section
    const initial = decodeURIComponent(location.hash.slice(1));
    if (initial && idToLi.has(initial)) setActive(initial);
    else {
      const first = [...idToLi.keys()][0];
      if (first) setActive(first);
    }

    // define teardown for next "updated" or unmount
    teardown = () => {
      io.disconnect();
      sidebar.removeEventListener("click", onClick);
    };
  }

  onMount(() => {
    updated();
    globalThis.addEventListener("updated", updated);
    return () => {
      globalThis.removeEventListener("updated", updated);
      teardown();
    };
  });
</script>

<nav class="sidebar">
  <ul>
    {#each sidebar as section (section.title)}
      <SidebarSection {section} {path} {toc} />
    {/each}
  </ul>
</nav>
