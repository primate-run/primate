import test from "primate/test";

const expected = "<button>German</button>";

test.get("/", response => {
  response.body.includes(expected);
});
