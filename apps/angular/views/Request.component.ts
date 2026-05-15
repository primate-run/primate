import { Component, input } from "@angular/core";

@Component({ template: `<span id="request">{{ request() }}</span>` })
export default class Request {
  request = input<string>();
}
