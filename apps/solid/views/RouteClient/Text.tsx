import route from "#route/route-client/text";
import { createSignal } from "solid-js";

export default function RouteClientText() {
  const [result, setResult] = createSignal<string | null>(null);

  async function send() {
    const response = await route.post({ body: "hello" });
    setResult(await response.text());
  }

  return (
    <>
      <button onclick={send}>Send</button>
      {result() !== null && <span id="result">{result()}</span>}
    </>
  );
}
