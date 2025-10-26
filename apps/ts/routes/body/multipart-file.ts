import p from "pema";
import route from "primate/route";

const schema = p({
  baz: p.u8,
  foo: p.string,
  //  greeting: p.file,
}).coerce;

route.post(async request => {
  const { baz, foo } = request.body.form(schema);
  const { greeting } = request.body.files();
  const content = await greeting.text();

  return {
    baz,
    foo,
    greeting: {
      content,
      name: greeting.name,
      size: greeting.size,
      type: greeting.type,
    },
  };
});
