import route from "primate/route";

export default route({
  async post(request) {
    return JSON.stringify(await request.body.json());
  },
});
