<script lang="ts">
  const { request } = $props<{ request: "foo" | undefined }>();
</script>

<span id="request">{request}</span>
