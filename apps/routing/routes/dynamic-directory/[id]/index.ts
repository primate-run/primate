import route from "primate/route";

route.get(request => request.path.parse({ parse: x => x }) as any);
