import test from "primate/test";

test.get("/", response => {
  response.body.includes(`<a>German</a></div></body>\n</html>`)
});
