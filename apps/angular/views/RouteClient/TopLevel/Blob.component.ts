import route from "#route/route-client/blob";
import { Component } from "@angular/core";

const response = await route.post({
  body: new Blob(["hello"], {
    type: "application/octet-stream",
  }),
});
const result = new TextDecoder().decode(await response.arrayBuffer());

@Component({
  template: `<span id="result">{{ result }}</span>`,
})
export default class TopLevelBlob {
  result = result;
}
