import test from "primate/test";

const expected = "<button>English</button> <button>German</button>";

test.get("/", response => {
  response.body.includes(expected);
});
