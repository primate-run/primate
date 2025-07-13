import compile from "#compile";
import BuildModule from "@primate/core/frontend/BuildModule";

export default class BuildVue extends BuildModule {
  name = "vue";
  compile = compile;
}
