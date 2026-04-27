// routes/api.ts
import route from "primate/route";

export default route({
  async post(request) {
    const received = await request.body.json();
    return { received };
  },
});
