import test from "primate/test";
import FileRef from "@rcompat/fs/FileRef";

const expected = await FileRef.join(import.meta.dirname, "index.expected.html")
  .text();

test.get("/", response => {
  response.body.includes(expected);
  /*response.client.query("span").equals("0");
  response.client.click("#increment");
  response.client.query("span").equals("1");
  response.client.click("#increment");
  response.client.query("span").equals("2");
  response.client.click("#decrement").click("#decrement");
  response.client.query("span").equals("0");*/
});
