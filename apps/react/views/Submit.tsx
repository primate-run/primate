import { client } from "@primate/react";

export default function Submit() {
  const form = client.form({ initial: { email: "" } });

  if (form.submitted) return <p id="submitted">submitted</p>;

  return (
    <form method="post" id={form.id} onSubmit={form.submit}>
      <button type="submit">Submit</button>
    </form>
  );
}
