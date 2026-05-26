import Counter from "#store/Counter";
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

    return response.view("Counter.marko", counter);
  },
  async post(request) {
    // validate that an id was provided
    const id = p.loose.u32.parse(request.query.get("id"));

    // validate that a request body contains a number value
    const counter = p.loose.number.parse(await request.body.json());

    // update the value in the database
    await Counter.update(id, { set: { counter } });

    // no response
    return null;
  },
});
