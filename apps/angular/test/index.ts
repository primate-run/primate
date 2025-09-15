import test from "primate/test";
import FileRef from "@rcompat/fs/FileRef";

const expected = "<ng-component ngh=\"1\"><a href=\"/redirect\">redirect</a><h1>";

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
