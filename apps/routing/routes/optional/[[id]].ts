import route from "primate/route";

route.get(request => request.path.try("id") ?? "index");
