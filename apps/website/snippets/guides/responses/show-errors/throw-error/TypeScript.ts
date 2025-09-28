// routes/api.ts
import route from "primate/route";

route.get(() => {
  throw new Error("Something went wrong");
});