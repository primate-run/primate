import route from "#route/route-client/multipart";
import { useState } from "react";

export default function ClientRouteMultipart() {
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    const body = new FormData();
    body.append("foo", "bar");
    body.append("file", new File(["hello"], "hello.txt", { type: "text/plain" }));
    const response = await route.post({ body });
    setResult(JSON.stringify(await response.json()));
  }

  return (
    <>
      <button onClick={send}>Send</button>
      {result !== null && <span id="result">{result}</span>}
    </>
  );
}
