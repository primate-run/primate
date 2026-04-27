import test from "primate/test";

test.get("/headers", response => {
  response.body.equals(JSON.stringify({
    accept: "*/*",
    "accept-encoding": "gzip, deflate",
    "accept-language": "*",
    connection: "keep-alive",
    host: "localhost:10018",
    "sec-fetch-mode": "cors",
    "user-agent": "node",
  }));
});

