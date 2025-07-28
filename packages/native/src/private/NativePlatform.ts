import type Platform from "@primate/core/Platform";

export default interface NativePlatform extends Platform {
  flags: string;
  exe: string;
}
