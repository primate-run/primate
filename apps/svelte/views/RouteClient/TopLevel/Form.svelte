<script>
  import route from "#route/route-client/form";

  const response = await route.post({
    body: new URLSearchParams({ foo: "bar" }),
  });
  const result = await response.json();
</script>

<span id="result">{JSON.stringify(result)}</span>
