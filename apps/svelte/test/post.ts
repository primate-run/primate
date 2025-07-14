import test from "primate/test";

const expected = `
<!--[--><!--[--><!----><ul><li><a href="/">overview</a></li></ul> 
<div><!----><!----><h1>Title: First post</h1> 
<div>Id: 1</div> 
<h3>Switch language</h3> 
<div>
  <a>English</a>
</div> <div>
  <a>German</a>
</div>
`;

test.get("/post/1", response => {
  response.body.includes(expected);
});
