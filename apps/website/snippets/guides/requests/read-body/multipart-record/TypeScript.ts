import route from "primate/route";

export default route({
  async post(request) {
    const { form, files } = await request.body.multipart();
    return { form };
  },
});
