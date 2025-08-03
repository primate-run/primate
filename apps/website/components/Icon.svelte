<script>
  export let name;
  export let size = 16;
</script>

<svg class="icon" width={size} height={size}>
  <use href="#{name}" />
</svg>

<style>
  .icon {
    position: relative;
    overflow: hidden;
    vertical-align: middle;
    object-fit: contain;
    transform-origin: center center;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }
</style>
