<script>
  export let toc;
</script>

<aside class="on-this-page">
<h4>On this page</h4>
<ul>
{#each toc as section}
<li>
  <a href="#{section.name}">{section.text}</a>
</li>
{/each}
</ul>
</aside>
