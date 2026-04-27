import route from "#route/route-client/json";
import { Component } from "@angular/core";

const response = await route.post({ body: { foo: "bar" } });
const result = JSON.stringify(await response.json());

@Component({
  template: `<span id="result">{{ result }}</span>`,
})
export default class TopLevel {
  result = result;
}
