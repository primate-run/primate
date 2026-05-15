import { Component, input } from "@angular/core";

@Component({
  template: "Hello, <span>{{ $foo }}</span>",
})
export default class PostIndex {
  foo = input<string>("");

  get $foo() {
    return this.foo();
  }
}
