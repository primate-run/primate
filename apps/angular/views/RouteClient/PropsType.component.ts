import type route from "#route/route-client/props-type";
import { Component, input } from "@angular/core";

type Props = typeof route.get.View;

@Component({
  template: `<span id="result">{{ message() }}</span>`,
})
export default class PropsType {
  message = input.required<Props["message"]>();
}
