import route from "primate/route";

route.post(request => {
  console.log(request.body.json());
  return null;
});
