import Counter from "@/stores/Counter";
import Form from "@/views/Form";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

await Counter.create();

export default route({
  async get() {
    const counters = await Counter.find({});

    const counter = counters.length === 0
      ? await Counter.insert({ counter: 10 })
      : counters[0];

    return response.view(Form, counter);
  },
  async post(request) {
    const id = p.loose.u32.parse(request.query.get("id"));
    const validated = p.loose({ counter: p.number })
      .parse(await request.body.form());

    await Counter.update(id, { set: { counter: validated.counter } });

    return null;
  },
});
