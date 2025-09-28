import Counter from "#store/Counter";
import pema from "pema";
import number from "pema/number";
import string from "pema/string";
import response from "primate/response";
import route from "primate/route";

await Counter.schema.create();

route.get(async () => {
  const counters = await Counter.find({});

  const counter = counters.length === 0
    ? await Counter.insert({ value: 10 })
    : counters[0];

  return response.view("Counter.jsx", counter);
});

route.post(async request => {
  // validate that an id was provided
  // request.query.get() will throw if id is missing
  const id = string.parse(request.query.get("id"));

  // validate body as a number, coercing from string first
  const body = request.body.fields(pema({ value: number }).coerce);

  // update the value in the database
  await Counter.update({ id }, { value: body.value });

  // 204 no response
  return null;
});
