import client from "@primate/solid/client";

export default function Submit() {
  const form = client.form({ initial: { email: "" } });

  return (
    <>
      {form.submitted ? (
        <p id="submitted">submitted</p>
      ) : (
        <form method="post" id={form.id} onSubmit={form.submit}>
          <button type="submit">Submit</button>
        </form>
      )}
    </>
  );
}
