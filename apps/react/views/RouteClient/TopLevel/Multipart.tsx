import route from "#route/route-client/multipart";

const body = new FormData();
body.append("foo", "bar");
body.append("file", new File(["hello"], "hello.txt", { type: "text/plain" }));
const response = await route.post({ body });
const result = await response.json();

export default function TopLevelMultipart() {
  return <span id="result">{JSON.stringify(result)}</span>;
}
