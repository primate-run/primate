import { createSignal } from "solid-js";

export default function Counter(props) {
  const [counter, setCounter] = createSignal(props.start);

  return (
    <div style={{ "text-align": "center", "margin-top": "2rem" }}>
      <h2>Counter Example</h2>
      <div>
        <button onClick={() => setCounter(counter() - 1)}>-</button>
        <span style={{ margin: "0 1rem" }}>{counter()}</span>
        <button onClick={() => setCounter(counter() + 1)}>+</button>
      </div>
    </div>
  );
}
