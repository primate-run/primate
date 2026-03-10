import { Component, Input } from "@angular/core";

@Component({
  template: "Hello, <span>{{ foo }}</span>",
})
export default class PostIndex {
  @Input() foo: string = "";
}
