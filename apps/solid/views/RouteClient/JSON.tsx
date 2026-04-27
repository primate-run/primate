import route from "#route/route-client/json";
import { createSignal } from "solid-js";

export default function RouteClientJSON() {
  const [result, setResult] = createSignal<string | null>(null);

  async function send() {
    const response = await route.post({ body: { foo: "bar" } });
    setResult(JSON.stringify(await response.json()));
  }

  return (
    <>
      <button onClick={send}>Send</button>
      {result() !== null && <span id="result">{result()}</span>}
    </>
  );
}
