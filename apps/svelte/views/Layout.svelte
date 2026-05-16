<script>
  import { ModeWatcher } from "mode-watcher";

  const { children } = $props();
</script>

<ModeWatcher />

<ul>
  <li>
    <a href="/">overview</a>
  </li>
</ul>
<div>
  {@render children()}
</div>
