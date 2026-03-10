import type Setup from "#module/Setup";

export default interface Module {
  name: string;
  setup(setup: Setup): void;
}
