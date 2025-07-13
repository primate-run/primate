import hash from "#hash";
import tags from "#tags";

type InlineType = "style" | "script" | "module" | "application/json";

async function inline(code: string, type: InlineType, id?: string) {
  const integrity = await hash(code);
  return { head: type === "style"
    ? tags.style({ code, inline: true })
    : tags.script({ code, type, inline: true, integrity, id })
  , integrity: `'${integrity}'` };
};

export default inline;
