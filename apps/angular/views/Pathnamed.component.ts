import { Component } from "@angular/core";
import { request } from "app:angular";

@Component({
  template: `
    <span id="pathname">{{ request().url.pathname }}</span>
    <a id="previous" href="/pathname">previous</a>
  `,
})
export default class Pathname {
  request = request;
}
