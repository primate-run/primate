import Counter from "#store/Counter";
import response from "primate/response";
import route from "primate/route";
import p from "pema";

await Counter.schema.create();

route.get(async () => {
  const counters = await Counter.find({});

  const counter = counters.length === 0
    ? await Counter.insert({ counter: 10 })
    : counters[0];

  return response.view("Counter.component.ts", counter);
});

route.post(async request => {
  // validate that an id was provided
  const id = p.string.parse(request.query.get("id"));

  // validate that a request body contains a number value
  const counter = request.body.json(p.number.coerce);

  // update the value in the database
  await Counter.update({ id }, { counter });

  // no response
  return null;
});
