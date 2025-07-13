import test from "primate/test";
import FileRef from "@rcompat/fs/FileRef";

const expected = await FileRef.join(import.meta.dirname, "index.expected.html")
  .text();

test.get("/", response => {
  response.body.includes(expected);
});
