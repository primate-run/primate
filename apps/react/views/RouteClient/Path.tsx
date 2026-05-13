import route from "#route/route-client/path/[name]";
import { useState } from "react";

export default function Path() {
  const [result, setResult] = useState(null);

  async function send() {
    const response = await route.post({ path: { name: "hello" } });
    setResult(await response.json());
  }

  return <>
    <button onClick={send}>Send</button>
    {result !== null && <span id="result">{JSON.stringify(result)}</span>}
  </>;
}
