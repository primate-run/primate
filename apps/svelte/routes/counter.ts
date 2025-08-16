import Counter from "#store/Counter";
import pema from "pema";
import i8 from "pema/i8";
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

  return view("Counter.svelte", counter);
});

route.post(async request => {
  // validate that an id was provided
  const id = string.parse(request.query.id);
  // validate that a request body contains a number value
  const body = request.body.fields(pema({ value: number }).coerce);

  i8.range(-20, 20).parse(body.value);

  // update the value in the database
  await Counter.update({ id }, { value: body.value });

  // no response
  return null;
});
