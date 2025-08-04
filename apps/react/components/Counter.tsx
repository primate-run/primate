import validate from "@primate/react/validate";

interface Props { id: string; value: number };

export default function Counter(props: Props) {
  const counter = validate<number>(props.value).post(
    `/counter?id=${props.id}`,
    value => ({ value }),
  );

  return (
    <div style={{ marginTop: "2rem", textAlign: "center" }}>
      <h2>Counter Example</h2>
      <div>
        <button onClick={() => counter.update(n => n - 1)}
          disabled={counter.loading}>
          -
        </button>
        <span style={{ margin: "0 1rem" }}>{counter.value}</span>
        <button onClick={() => counter.update(n => n + 1)}
          disabled={counter.loading}>
          +
        </button>
      </div>
      {counter.error && <p style={{ color: "red" }}>{counter.error.message}</p>}
    </div>);
}
