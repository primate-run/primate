import route from "#route/route-client/text";
import { useState } from "react";

export default function ClientRouteText() {
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    const response = await route.post({ body: "hello" });
    setResult(await response.text());
  }

  return (
    <>
      <button onClick={send}>Send</button>
      {result !== null && <span id="result">{result}</span>}
    </>
  );
}
