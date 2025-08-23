import render from "#render";
import FrontendModule from "@primate/core/frontend/Module";
import { type Renderer } from "vue";

export default class Runtime extends FrontendModule<Renderer> {
  name = "vue";
  defaultExtensions = [".vue"];
  layouts = false;
  client = true;
  render = render;
};
