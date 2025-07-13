import test from "primate/test";

const expected = `
+</button> 
0</div> <h3>Switch language</h3> 
<div>
  <a>English</a>
</div> <div>
  <a>German</a>
</div>
`;

test.get("/", response => {
  response.body.includes(expected);
});
