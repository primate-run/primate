// routes/api.ts
import route from "primate/route";

export default route({
  get(request) {
    return request.forward("https://api.example.com");
  },
});
