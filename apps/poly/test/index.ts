import test from "primate/test";

const expected = `<h3>Switch language</h3>
 <button>English</button> <button>
  German
</button>
`;

test.get("/", response => {
  response.body.includes(expected);
});
