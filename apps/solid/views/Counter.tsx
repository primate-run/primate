import validate from "@primate/solid/validate";

interface Props { counter: number; id: string };

export default function Counter(props: Props) {
  const counter = validate<number>(props.counter)
    .post(`/counter?id=${props.id}`);

  return (
    <div style={{ "margin-top": "2rem", "text-align": "center" }}>
      <h2>Counter Example</h2>
      <div>
        <button onClick={() => counter.update(n => n - 1)}
          disabled={counter.loading()}>
          -
        </button>
        <span style={{ margin: "0 1rem" }}>{counter.value()}</span>
        <button onClick={() => counter.update(n => n + 1)}
          disabled={counter.loading()}>
          +
        </button>
      </div>
      {counter.error()
        && <p style={{ color: "red" }}>{counter.error()!.message}</p>}
    </div>
  );
}
