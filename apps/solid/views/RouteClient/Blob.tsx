import route from "#route/route-client/blob";
import { createSignal } from "solid-js";

export default function ClientRouteBlob() {
  const [result, setResult] = createSignal<string | null>(null);

  async function send() {
    const body = new Blob(["hello"], { type: "application/octet-stream" });
    const response = await route.post({ body });
    const text = new TextDecoder().decode(await response.arrayBuffer());
    setResult(text);
  }

  return (
    <>
      <button onClick={send}>Send</button>
      {result() !== null && <span id="result">{result()}</span>}
    </>
  );
}
