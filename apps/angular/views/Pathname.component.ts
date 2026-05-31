import { Component } from "@angular/core";
import { request } from "app:angular";

@Component({
  template: `
    <span id="pathname">{{ request().url.pathname }}</span>
    <a id="next" href="/pathnamed">next</a>
  `,
})
export default class Pathname {
  request = request;
}
