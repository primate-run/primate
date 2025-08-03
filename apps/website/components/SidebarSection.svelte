<script>
  export let section;
//  console.log("section", section);
</script>

<li class="heading">{section.title}</li>
{#each section.items as item}
  <li>
    <a href={`/docs${item.href}`}>{item.title}</a>
  </li>
{/each}
