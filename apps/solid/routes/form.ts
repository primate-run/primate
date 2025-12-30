import Counter from "#store/Counter";
import Form from "#view/Form";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

await Counter.collection.create();

route.get(async () => {
  const counters = await Counter.find({});

  const counter = counters.length === 0
    ? await Counter.insert({ counter: 10 })
    : counters[0];

  return response.view(Form, counter);
});

route.post(async request => {
  const id = p.string.parse(request.query.get("id"));
  const FormSchema = p({ counter: p.number.coerce });
  const validated = request.body.form(FormSchema);

  await Counter.update({ id }, { counter: validated.counter });

  return null;
});
