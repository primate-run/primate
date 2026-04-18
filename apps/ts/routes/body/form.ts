import route from "primate/route";

export default route({
  async post(request) {
    return request.body.form();
  },
});
