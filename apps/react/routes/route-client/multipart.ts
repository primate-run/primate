import View from "#view/RouteClient/Multipart";
import TopLevel from "#view/RouteClient/TopLevel/Multipart";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.view(request.query.has("top-level") ? TopLevel : View);
  },
  post: route.with({ contentType: "multipart/form-data" }, async request => {
    const { form, files } = await request.body.multipart();
    return {
      foo: form.foo,
      file: await files.file.text(),
    };
  }),
});
