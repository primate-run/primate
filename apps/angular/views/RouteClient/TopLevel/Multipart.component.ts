import route from "#route/route-client/multipart";
import { Component } from "@angular/core";

const body = new FormData();
body.append("foo", "bar");
body.append("file", new File(["hello"], "hello.txt", { type: "text/plain" }));
const response = await route.post({ body });
const result = JSON.stringify(await response.json());

@Component({
  template: `<span id="result">{{ result }}</span>`,
})
export default class TopLevelMultipart {
  result = result;
}
