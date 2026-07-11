import { Component, input } from "@angular/core";
import type route from "./index";

type Props = typeof route.get.Page;

@Component({
  template: `<span id="result">{{ message() }}</span>`,
})
export default class Page {
  message = input.required<Props["message"]>();
}
