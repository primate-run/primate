<script>
  export let start = 0;
  let counter = start;

  function increment() {
    counter++;
  }

  function decrement() {
    counter--;
  }
</script>

<div style="text-align: center; margin-top: 2rem;">
  <h2>Counter Example</h2>
  <div>
    <button on:click={decrement}>-</button>
    <span style="margin: 0 1rem;">{counter}</span>
    <button on:click={increment}>+</button>
  </div>
</div>
