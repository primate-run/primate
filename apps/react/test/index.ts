import test from "primate/test";

const expected = `
<h1>All posts</h1>
<h2>
  <a href=\"/post/1\">First post</a>
</h2>
<h3>Counter</h3>
<div>
  <button>-</button>
  <button>+</button>0
</div>
<h3>Switch language</h3>
<div>
  <a>English</a>
</div>
<div>
  <a>German</a>
</div>
`.replaceAll("\n", "").replaceAll("  ", "");

test.get("/", response => {
  response.body.includes(expected);
});
