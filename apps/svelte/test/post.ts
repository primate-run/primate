import test from "primate/test";

const expected = "<button>English</button> <button>German</button>";

test.get("/post/1", response => {
  response.body.includes(expected);
});
