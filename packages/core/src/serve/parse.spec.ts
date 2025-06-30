// import config from "#config";
// import mark from "#mark";
// import { form, json } from "@rcompat/http/mime";
// import get from "@rcompat/record/get";
// import parse from "#serve/parse";
// import test from "@rcompat/test";
// import never from "@rcompat/test/never";

// const app = {
//   get: (config_key: string) => get(config, config_key),
// };
// const verbs = ["get", "post", "put", "delete"];
// const r = await (async () => {
//   const p = "https://primate.run";
//   const request = (method: string, path = "/", options = {}) =>
//     new Request(`${p}${path}`, { method, ...options });
//   return Object.fromEntries(verbs.map(verb => [verb, (...params: string[]) =>
//     (parse(app as any) as any)(request(verb.toUpperCase(), ...params))]));
// })();

// test.case("no body => {}", async assert => {
//   assert((await r.get("/")).body).equals({});
//   assert((await r.post("/")).body).equals({});
// });

// test.case("body is json", async assert => {
//   const body = JSON.stringify({ foo: "bar" });
//   const headers = { "content-type": json };
//   const request = await r.post("/", never({ body, headers }));
//   assert(request.body).equals({ foo: "bar" });
//   assert(request.body.foo).equals("bar");
//   assert(request.body.bar).undefined();

//   const faulty = `${body}%`;
//   const error = `cannot parse body with content type ${json}`;
//   const throws = mark("{0}: {1}", "/", error);
//   assert(() => r.post("/", never({ body: faulty, headers }))).throws(throws);
// });

// test.case("body is form", async assert => {
//   const { body } = await r.post("/", never({
//      body: encodeURI("foo=bar &bar=baz"),
//      headers: {
//        "content-type": form,
//      },
//   }));

//   assert(body).equals({ foo: "bar ", bar: "baz" });
//   assert(body.foo).equals("bar ");
//   assert(body.bar).equals("baz");
//   assert(body.baz).undefined();
// });

// test.case("url / path traversal", async assert => {
//   const matches = (urls: string[], expected: string) =>
//     Promise.all(urls.map(async (url: string) => {
//       const { pathname } = (await r.get(`/${url}`)).url;
//       assert(await pathname).equals(expected.toString());
//     }));
//   await matches([
//     "..",
//     "../",
//     "../..",
//     "../../",
//     "../../.",
//     "%2E",
//     "%2e",
//     "%2E%2e",
//     "%2e%2e",
//     "%2E%2e",
//     "%2e%2e%2f",
//     "%2e%2e/",
//     "..%2f",
//     "..%5c",
//     "..\\",
//   ], "/");
// });

// test.case("query", async assert => {
//   assert((await r.get("/")).query).equals({});

//   const r0 = await r.get("/?foo=bar");
//   assert(r0.query).equals({ foo: "bar" });
//   assert(r0.query.foo).equals("bar");
//   assert(r0.query.bar).undefined();

//   const r1 = await r.get("/?foo=bar&bar=baz");
//   assert(r1.query).equals({ foo: "bar", bar: "baz" });
//   assert(r1.query.foo).equals("bar");
//   assert(r1.query.bar).equals("baz");
//   assert(r1.query.baz).undefined();

//   const r2 = await r.get("/?url=https://primate.run");
//   assert(r2).equals({ url: "https://primate.run" });
//   assert(r2.query.url).equals("https://primate.run");
// });

// test.case("cookies", async assert => {
//   assert((await r.get("/")).cookies).equals({});

//   const r0 = await r.get("/?key=value", never({ headers: { cookie: "" } }));
//   assert(r0.cookies).equals({});

//   const r1 = await r.get("/?key=value",
//     never({ headers: { cookie: "key=value" } }));
//   assert(r1.cookies).equals({ key: "value" });
//   assert(r1.cookies.key).equals("value");
//   assert(r1.cookies.key2).undefined();

//   const r1a = await r.get("/?key=value", never({ headers: {
//     cookie: "key=value;",
//   } }));
//   assert(r1a.cookies).equals({ key: "value" });
//   assert(r1a.cookies.key).equals("value");
//   assert(r1a.cookies.key2).undefined();

//   const r2 = await r.get("/?key=value", never({ headers: {
//    cookie: "key=value;key2=value2",
//   } }));
//   assert(r2.cookies).equals({ key: "value", key2: "value2" });
//   assert(r2.cookies.key).equals("value");
//   assert(r2.cookies.key2).equals("value2");
//   assert(r2.cookies.key3).undefined();
// });

// test.case("headers", async assert => {
//   assert((await r.get("/")).headers).equals({});

//   const r0 = await r.get("/?key=value", never({ headers: {
//      "x-user": "Donald",
//   } }));

//   assert(r0.headers).equals({ "x-user": "Donald" });
//   assert(r0.headers["x-user"]).equals("Donald");
//   assert(r0.headers["X-User"]).undefined();
//   assert(r0.headers["X-USER"]).undefined();
//   assert(r0.headers["x-user2"]).undefined();
// });

// test.case("cookies double as headers", async assert => {
//   const r0 = await r.get("/?key=value", never({
//      headers: {
//        cookie: "key=value",
//      },
//   }));
//   assert(r0.headers).equals({ cookie: "key=value" });
//   assert(r0.headers.cookie).equals("key=value");
//   assert(r0.cookies).equals({ key: "value" });
//   assert(r0.cookies.key).equals("value");
// });
