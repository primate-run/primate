import Status from "primate/http/Status";
import FileRef from "@rcompat/fs/FileRef";
import test from "primate/test";

const { dirname } = import.meta;
const expected = await FileRef.join(dirname, "index.expected.html").text();

test.get("/", response => {
  response.status.equals(Status.OK);
  response.body.includes(expected);
});
