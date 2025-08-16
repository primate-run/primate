import pema from "pema";
import file from "pema/file";
import string from "pema/string";
import u8 from "pema/u8";
import route from "primate/route";

const schema = pema({
  baz: u8,
  foo: string,
  greeting: file,
}).coerce;

route.post(async request => {
  const { baz, foo, greeting } = request.body.fields(schema);
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
