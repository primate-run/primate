import { Component, input } from "@angular/core";
import type route from "./props-type";

type Props = typeof route.get.Page;

@Component({
  template: `<span id="result">{{ message() }}</span>`,
})
export default class PropsType {
  message = input.required<Props["message"]>();
}
