import route from "primate/route";

route.post(request => {
  const received = request.body.form();
  return { received };
});
