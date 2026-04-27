import route from "#route/route-client/text";

const response = await route.post({ body: "hello" });
const result = await response.text();

export default function TopLevelText() {
  return <span id="result">{result}</span>;
}
