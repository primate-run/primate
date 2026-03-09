import type { Target } from "@primate/core";

export default interface NativeTarget extends Target {
  exe: string;
  flags: string;
}
