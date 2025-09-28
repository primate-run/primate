// routes/api.ts
import route from "primate/route";

route.post(request => {
  const received = request.body.text();
  return { received };
});
