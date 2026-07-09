import route from "@/routes/route-client/form";

const response = await route.post({
  body: new URLSearchParams({ foo: "bar" }),
});
const result = await response.json();

export default function TopLevelForm() {
  return <span id="result">{JSON.stringify(result)}</span>;
}
