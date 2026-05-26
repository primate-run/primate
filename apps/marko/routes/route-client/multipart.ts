import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return request.query.has("top-level")
      ? response.view("RouteClient/TopLevel/Multipart.marko", {
        result: JSON.stringify({ foo: "bar", file: "hello" }),
      })
      : response.view("RouteClient/Multipart.marko");
  },
  post: route.with({ contentType: "multipart/form-data" }, async request => {
    const { form, files } = await request.body.multipart();
    return {
      foo: form.foo,
      file: await files.file.text(),
    };
  }),
});
