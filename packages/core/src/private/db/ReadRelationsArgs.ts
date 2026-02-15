import type ReadArgs from "#db/ReadArgs";
import type With from "#db/With";

export default interface ReadRelationsArgs extends ReadArgs {
  with: With;
}
