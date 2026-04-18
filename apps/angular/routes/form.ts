import Counter from "#store/Counter";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

await Counter.table.create();

export default route({
  async get() {
    const counters = await Counter.find({});

    const counter = counters.length === 0
      ? await Counter.insert({ counter: 10 })
      : counters[0];

    return response.view("Form.component.ts", counter);
  },
  async post(request) {
    const id = p.u32.coerce(request.query.get("id"));
    const validated = p({ counter: p.number })
      .coerce(await request.body.form());

    await Counter.update(id, { set: { counter: validated.counter } });

    return null;
  },
});
