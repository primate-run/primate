import { client } from "@primate/solid";

interface Props { counter: number; id: number };

export default function Form(props: Props) {
  const form = client.form({ initial: { counter: props.counter } });

  return <form
    method="post"
    action={`/form?id=${props.id}`}
    id={form.id}
    onSubmit={form.submit}
  >
    {form.errors.length > 0
      ? <p style={{ color: "red" }}>{form.errors[0]}</p>
      : ""
    }
    <label>
      Counter:
      <input
        type="number"
        name={form.field("counter").name}
        value={form.field("counter").value}
      />
    </label>
    {form.field("counter").error
      ? <p id="counter-error" style={{ color: "red" }}>{form.field("counter").error}</p>
      : ""
    }
    {form.submitted && <span id="submitted">saved</span>}
    <button type="submit" disabled={form.submitting}>Save</button>
  </form >;
}
