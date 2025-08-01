import hash from "#hash";
import tags from "#tags";

type InlineType = "application/json" | "module" | "script" | "style";

async function inline(code: string, type: InlineType, id?: string) {
  const integrity = await hash(code);
  return { head: type === "style"
    ? tags.style({ code, inline: true })
    : tags.script({ code, id, inline: true, integrity, type })
  , integrity: `'${integrity}'` };
};

export default inline;
