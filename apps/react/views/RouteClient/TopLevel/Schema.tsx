import route from "#route/route-client/schema";

const response = await route.post({ body: { foo: "bar" } });
const result = await response.json();

export default function TopLevelSchema() {
  return <span id="result">{JSON.stringify(result)}</span>;
}
