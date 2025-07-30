import Status from "primate/http/Status";
import test from "primate/test";

const expected = `
<h1>All posts</h1>
`;

test.get("/", response => {
  response.status.equals(Status.OK);
  response.body.includes(expected);
});
