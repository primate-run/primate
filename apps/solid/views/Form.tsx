import client from "@primate/solid/client";

interface Props { counter: number; id: string };

export default function Form(props: Props) {
  const form = client.form({ initial: { counter: props.counter } });

  return <form
    method="post"
    action={`/form?id=${props.id}`}
    id={form.id}
    onSubmit={form.submit}
  >
    {form.errors.length
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
      ? <p style={{ color: "red" }} > {form.field("counter").error}</p>
      : ""
    }

    <button type="submit" disabled={form.submitting}>Save</button>
  </form >;
}
