import route from "#route/route-client/form";
import { Component } from "@angular/core";

const response = await route.post({
  body: new URLSearchParams({
    foo: "bar",
  }),
});
const result = JSON.stringify(await response.json());

@Component({
  template: `<span id="result">{{ result }}</span>`,
})
export default class TopLevelForm {
  result = result;
}
