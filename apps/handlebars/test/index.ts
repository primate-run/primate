import test from "primate/test";

const expected = `
<h2>
  <a href="/post/1">First post</a>
</h2>
`;

test.get("/", response => {
  response.body.includes(expected);
});
