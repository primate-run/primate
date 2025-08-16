import route from "primate/route";

route.post(request => JSON.stringify(request.body.json()));
