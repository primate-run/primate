import type route from "./[id]";
import { Component, input } from "@angular/core";

type Props = typeof route.get.Page;

@Component({
  template: `<h1>Post {{ id() }}</h1>`,
})
export default class Post {
  id = input.required<Props["id"]>();
}
