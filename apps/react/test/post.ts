import test from "primate/test";

const expected = `
<ul>
  <li>
    <a href=\"/\">overview</a>
  </li>
</ul>
<div>
  <h1>Title<!-- -->: <!-- -->First post</h1>
  <div>Id: <!-- -->1</div>
</div>
`.replaceAll("\n", "").replaceAll("  ", "");

test.get("/post/1", response => {
  response.body.includes(expected);
});
