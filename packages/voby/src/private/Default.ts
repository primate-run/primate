import Runtime from "#Runtime";
import voby from "@rcompat/build/preset/voby";
import transform from "@rcompat/build/sync/transform";

export default class VobyDefault extends Runtime {
  compile = {
    server: (text: string) => transform(text, voby).code,
  };
}
