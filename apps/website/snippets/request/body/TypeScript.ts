import route from "primate/route";

route.post(request => `Hello, ${request.body.fields().name}`);
