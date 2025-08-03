import Counter from "#store/Counter";
import number from "pema/number";
import string from "pema/string";
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
  // since most values on the web are strings, we need to coerce to a number
  // before validation
  const value = number.validate(request.body.value, { coerce: true });

  // update the value in the database
  await Counter.update({ id }, { value });

  // no response
  return null;
});
