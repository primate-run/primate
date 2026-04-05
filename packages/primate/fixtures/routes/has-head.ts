import route from "primate/route";

route.get(() => ({ foo: "bar" }));
route.head(() => new Response(null, { headers: { "x-custom": "bespoke" } }));
