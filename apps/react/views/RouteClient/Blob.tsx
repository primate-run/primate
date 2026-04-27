import route from "#route/route-client/blob";
import { useState } from "react";

export default function ClientRouteBlob() {
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    const body = new Blob(["hello"], { type: "application/octet-stream" });
    const response = await route.post({ body });
    const text = new TextDecoder().decode(await response.arrayBuffer());
    setResult(text);
  }

  return (
    <>
      <button onClick={send}>Send</button>
      {result !== null && <span id="result">{result}</span>}
    </>
  );
}
