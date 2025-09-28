import route from "primate/route";

route.get(() => ({ message: "Hello", data: [1, 2, 3] }));
