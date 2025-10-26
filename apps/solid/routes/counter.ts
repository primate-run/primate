import Counter from "#store/Counter";
import number from "pema/number";
import string from "pema/string";
import response from "primate/response";
import route from "primate/route";

await Counter.schema.create();

route.get(async () => {
  const counters = await Counter.find({});

  const counter = counters.length === 0
    ? await Counter.insert({ counter: 10 })
    : counters[0];

  return response.view("Counter.tsx", counter);
});

route.post(async request => {
  // validate that an id was provided
  const id = string.parse(request.query.get("id"));

  // validate that a request body contains a number value
  const counter = request.body.json(number.coerce);

  // update the value in the database
  await Counter.update({ id }, { counter });

  // no response
  return null;
});
