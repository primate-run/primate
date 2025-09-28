// routes/api.ts
import route from "primate/route";

route.get(request => request.forward("https://api.example.com"), {
  parseBody: false,
});