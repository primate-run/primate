import route from "#route/route-client/json";

const response = await route.post({
  body: { foo: "bar" },
});
const result = await response.json();

export default function TopLevelJSON() {
  return <span id="result">{JSON.stringify(result)}</span>;
}
