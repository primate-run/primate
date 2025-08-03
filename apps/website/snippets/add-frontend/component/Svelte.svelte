<script>
  export let start = 0;
  let count = start;

  function increment() {
    count++;
  }

  function decrement() {
    count--;
  }
</script>

<div style="text-align: center; margin-top: 2rem;">
  <h2>Counter Example</h2>
  <div>
    <button on:click={decrement}>-</button>
    <span style="margin: 0 1rem;">{count}</span>
    <button on:click={increment}>+</button>
  </div>
</div>
