import { createSignal } from "solid-js";

export default function Counter(props) {
  const [count, setCount] = createSignal(props.start);

  return (
    <div style={{ "text-align": "center", "margin-top": "2rem" }}>
      <h2>Counter Example</h2>
      <div>
        <button onClick={() => setCount(count() - 1)}>-</button>
        <span style={{ margin: "0 1rem" }}>{count()}</span>
        <button onClick={() => setCount(count() + 1)}>+</button>
      </div>
    </div>
  );
}
