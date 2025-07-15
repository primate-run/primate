import test from "primate/test";

const expected = `<a>German</a></div>`;

test.get("/", response => {
  response.body.includes(expected);
});
