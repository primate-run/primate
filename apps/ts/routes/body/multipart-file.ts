import pema from "pema";
import string from "pema/string";
import u8 from "pema/u8";
import route from "primate/route";

const schema = pema({
  baz: u8,
  foo: string,
  //  greeting: file,
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
