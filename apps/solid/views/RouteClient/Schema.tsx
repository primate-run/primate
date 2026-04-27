import route from "#route/route-client/schema";
import { createSignal } from "solid-js";

export default function ClientRouteSchema() {
  const [result, setResult] = createSignal<string | null>(null);
  const [error, setError] = createSignal<number | null>(null);

  async function send() {
    const response = await route.post({ body: { foo: "bar" } });
    setResult(JSON.stringify(await response.json()));
  }

  async function send_invalid() {
    const response = await route.post({ body: { foo: 123 as any } });
    setError(response.status);
  }

  return (
    <>
      <button id="send" onClick={send}>Send</button>
      <button id="send-invalid" onClick={send_invalid}>Send Invalid</button>
      {result() !== null && <span id="result">{result()}</span>}
      {error() !== null && <span id="error">{error()}</span>}
    </>
  );
}
