import route from "primate/route";

export default route({
  async post(request) {
    return (await request.body.multipart()).form;
  },
});
