import route from "#route/route-client/text";
import { Component } from "@angular/core";

const response = await route.post({ body: "hello" });
const result = await response.text();

@Component({
  template: `<span id="result">{{ result }}</span>`,
})
export default class TopLevelText {
  result = result;
}
