import { useState } from "react";

export default function Counter(props) {
  const [count, setCount] = useState(props.start);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h2>Counter Example</h2>
      <div>
        <button onClick={() => setCount(count - 1)}>-</button>
        <span style={{ margin: "0 1rem" }}>{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  );
}
