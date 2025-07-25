import test from "primate/test";

test.get("/headers", response => {
  response.body.equals({
    accept: "*/*",
    "accept-encoding": "gzip, deflate",
    "accept-language": "*",
    connection: "keep-alive",
    host: "localhost:10015",
    "sec-fetch-mode": "cors",
    "user-agent": "node",
  });
});

