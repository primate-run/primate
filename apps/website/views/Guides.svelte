<script>
  import Header from "#component/Header";
  import Footer from "#component/Footer";
  import Guides from "#component/Guides";

  export let title = "The Universal Web Framework";
  export let guides;
</script>

<Header {title} />

<main>
  <Guides {guides} />
</main>

<Footer />

<style>
  main {
    display: block;
    padding-top: var(--height);
    max-width: none;
  }
</style>
