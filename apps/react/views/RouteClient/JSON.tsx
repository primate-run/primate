import route from "#route/route-client/json";
import { useState } from "react";

export default function ClientRouteJSON() {
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    const response = await route.post({ body: { foo: "bar" } });
    setResult(JSON.stringify(await response.json()));
  }

  return (
    <>
      <button onClick={send}>Send</button>
      {result !== null && <span id="result">{result}</span>}
    </>
  );
}
