import Runtime from "#Runtime";
import voby from "@rcompat/build/preset/voby";
import transform from "@rcompat/build/sync/transform";

export default class Default extends Runtime {
  compile = {
    server: (text: string) => transform(text, voby).code,
  };
}
