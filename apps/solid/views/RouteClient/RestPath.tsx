import route from "@/routes/route-client/rest-path/[...name]";
import { createSignal } from "solid-js";

export default function Path(props: { name: string }) {
  const [result, setResult] = createSignal(null);

  async function send() {
    const response = await route.post({ path: { name: props.name } });
    setResult(await response.json());
  }

  return <>
    <button onClick={send}>Send</button>
    {result() !== null && <span id="result">{JSON.stringify(result())}</span>}
  </>;
}
