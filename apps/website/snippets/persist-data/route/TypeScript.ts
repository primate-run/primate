import Counter from "#store/Counter";
import string from "pema/string";
// we use the web variant of this validator to coerce strings to the target types
import number from "pema/web/number";
import route from "primate/route";
import view from "primate/view";

await Counter.schema.create();

route.get(async () => {
  const counters = await Counter.find({});

  const counter = counters.length === 0
    ? await Counter.insert({ value: 10 })
    : counters[0];

  return view("Counter.jsx", counter);
});

route.post(async request => {
  // validate that an id was provided
  const id = string.validate(request.query.id);
  // validate that the request body contains a number value
  const value = number.validate(request.body.value);

  // update the value in the database
  await Counter.update({ id }, { value });

  // no response
  return null;
});
