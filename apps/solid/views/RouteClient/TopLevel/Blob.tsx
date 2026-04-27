import route from "#route/route-client/blob";

const response = await route.post({
  body: new Blob(["hello"], {
    type: "application/octet-stream",
  }),
});
const result = new TextDecoder().decode(await response.arrayBuffer());

export default function TopLevelBlob() {
  return <span id="result">{result}</span>;
}
