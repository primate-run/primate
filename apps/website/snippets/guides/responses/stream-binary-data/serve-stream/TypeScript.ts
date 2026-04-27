// routes/backstream.ts
import route from "primate/route";

export default route({
  post(request) {
    return request.body.binary();
  },
});
