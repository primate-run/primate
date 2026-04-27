// routes/api.ts
import route from "primate/route";

export default route({
  async post(request) {
    const blob = await request.body.blob();
    return { blob };
  },
});
