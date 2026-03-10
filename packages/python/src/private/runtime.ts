import type { Input } from "#module";
import module from "#module";
import type { Module } from "@primate/core";

export default function runtime_module(input: Input = {}): Module {
  const options = module.schema.parse(input);
  void options;

  return {
    name: module.name,

    setup() { },
  };
}
