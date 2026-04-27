import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    const toplevel = request.query.has("top-level") ? "TopLevel/" : "";
    return response.view(`RouteClient/${toplevel}Multipart.component.ts`);
  },
  post: route.with({ contentType: "multipart/form-data" }, async request => {
    const { form, files } = await request.body.multipart();
    return {
      foo: form.foo,
      file: await files.file.text(),
    };
  }),
});
