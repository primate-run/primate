import { Component, Input } from "@angular/core";

@Component({
  template: `<span id="request">{{ request }}</span>`,
})
export default class Request {
  @Input() request: string | undefined = undefined;
}
