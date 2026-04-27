import p from "pema";
import route from "primate/route";

const schema = p({
  baz: p.u8,
  foo: p.string,
  //  greeting: p.file,
});

export default route({
  async post(request) {
    const { form, files } = await request.body.multipart();
    const { baz, foo } = schema.coerce(form);
    const { greeting } = files;
    const content = await files.greeting.text();

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
  },
});
