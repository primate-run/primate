import { useState } from "react";

export default function Counter(props) {
  const [count, setCount] = useState(props.start);

  async function update(value: number) {
    fetch("/", {
      body: JSON.stringify({ value }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then(response => {
      if (response.ok) {
        setCount(value);
      } else {
        console.log("ERROR!");
      }
    });
  }

  return (
    <div style={{ marginTop: "2rem", textAlign: "center" }}>
      <h2>Counter Example</h2>
      <div>
        <button onClick={() => update(count - 1)}>-</button>
        <span style={{ margin: "0 1rem" }}>{count}</span>
        <button onClick={() => update(count + 1)}>+</button>
      </div>
    </div>
  );
}
