import route from "#route/route-client/form";
import { createSignal } from "solid-js";

export default function ClientRouteForm() {
  const [result, setResult] = createSignal<string | null>(null);

  async function send() {
    const body = new URLSearchParams({ foo: "bar" });
    const response = await route.post({ body });
    setResult(JSON.stringify(await response.json()));
  }

  return (
    <>
      <button onClick={send}>Send</button>
      {result() !== null && <span id="result">{result()}</span>}
    </>
  );
}
