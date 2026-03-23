import Counter from "#store/Counter";
import CounterView from "#view/Counter";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

await Counter.table.create();

route.get(async () => {
  const counters = await Counter.find({});

  const counter = counters.length === 0
    ? await Counter.insert({ counter: 10 })
    : counters[0];

  return response.view(CounterView, counter);
});

route.post(async request => {
  // validate that an id was provided
  const id = p.u32.coerce(request.query.get("id"));

  // validate that a request body contains a number value
  const counter = p.number.coerce(request.body.json());

  // update the value in the database
  await Counter.update(id, { set: { counter } });

  // no response
  return null;
});
