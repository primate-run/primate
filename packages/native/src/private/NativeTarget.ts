import type Target from "@primate/core/Target";

export default interface NativeTarget extends Target {
  exe: string;
  flags: string;
}
