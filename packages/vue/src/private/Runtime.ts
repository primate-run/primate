import render from "#render";
import Module from "@primate/core/frontend/Module";
import { type Renderer } from "vue";

export default class Runtime extends Module<Renderer> {
  name = "vue";
  defaultExtension = ".vue";
  layouts = false;
  client = true;
  render = render;
};
