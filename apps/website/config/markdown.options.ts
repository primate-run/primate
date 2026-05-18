import type { FileRef } from "@rcompat/fs";
import runtime from "@rcompat/runtime";
import highlighter from "./highlighter.ts";

const sorting = [
  "npm",
  "pnpm",
  "Yarn",
  "Node",
  "Deno",
  "Bun",
  "React",
  "Angular",
  "Vue",
  "Svelte",
  "Solid",
  "TypeScript",
  "JavaScript",
  "Go",
  "Python",
  "Ruby",
  "SQLite",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Store",
  "Route",
  "Component",
];

function trim(filename: string) {
  return /^\d-/.test(filename) ? filename.slice(2) : filename;
}

function make_captions(captionline: string) {
  const captions = captionline.split(",").map(p => p.split(":")[0]);
  const filenames = captionline.split(",").map(p => p.split(":")[1]);

  const filename_block = filenames[0] !== undefined
    ? `<span class="filenames">${filenames.map((filename, i) =>
      `<span${i === 0 ? " class='active'" : ""}>${filename}</span>`)
      .join("")}</span>`
    : "";

  return `<span class="captionline">
    <span class="captions">${captions.map((caption, i) =>
    `<span${i === 0 ? " class='active'" : ""}>${caption}</span>`)
      .join("")
    }</span>${filename_block}</span>`;
}

const toIcon = (id: string) =>
  `<svg class="icon" width="16" height="16"><use href="#${id}"></use></svg>`;

export default {
  marked: {
    hooks: {
      postprocess(html: string) {
        return html.replaceAll(
          /!!!\s*([a-zA-Z0-9_-]+)?\n([\s\S]*?)\n!!!/g,
          (_, icon, content) => {
            const iconHtml = icon ? toIcon(icon) : "";
            return `<div class="box">${iconHtml}${content.trim()}</div>`;
          },
        )
          .replaceAll("✓", toIcon("check"))
          .replaceAll("✗", toIcon("x2"));
      },
      preprocess(html: string) {
        return html.replaceAll(/%%%(.*?)\n(.*?)%%%/gus, (_, p1, p2) => {
          const t = (p2 as string)
            .split("\n```")
            .filter((p) => p !== "" && !p.startsWith("\n"))
            .map((p, i) => `<div${i === 0 ? "" : " class='hidden'"}>

\`\`\`${p}
\`\`\`

</div>`).join("");
          return `<div class="tabbed">${make_captions(p1)}<span class="tabs">${t}</span></div>`;
        });
      },
    },
    renderer: {
      code(token: { lang?: string; text: string }) {
        const [lang] = token.lang!.split(" ");
        const value = highlighter.codeToHtml(token.text, {
          lang,
          themes: {
            dark: "nord",
            light: "nord",
          },
        });
        const clipboard = `
          <div class="to-clipboard">
            <svg class="copy" width="16" height="16">
              <use href="#copy" />
            </svg>
            <svg class="check" width="16" height="16">
              <use href="#check" />
            </svg>
          </div>

        `;
        return `${clipboard}${value}`;
      },
      heading(token: { depth: number; text: string }) {
        const level = token.depth;
        const text = token.text;

        const name = token.text.toLowerCase()
          .replaceAll(/[?{}%`]/gu, "")
          .replace(/[^\w]+/gu, "-")
          .replace(/^-+|-+$/g, "");

        const deeplink = `
          <a class="deeplink" href="#${name}">
            <svg class="icon" width="16" height="16">
              <use href="#hash" />
            </svg>
          </a>
        `;

        return `
          <h${level} id="${name}">
            ${text.replace(/`([^`]+)`/g, "<code>$1</code>")}
            ${level !== 1 ? deeplink : ""}
          </h${level}>
        `;
      },
    },
  },
  async pretransform(text: string) {
    const externals = /\[s=([^\]]+)\]/g;
    const replacements = [];

    let match;
    while ((match = externals.exec(text)) !== null) {
      const [fullMatch, folder] = match;
      replacements.push({ folder, fullMatch });
    }

    if (replacements.length === 0) {
      return text;
    }

    let replaced = text;
    let replacement = "";

    for (const { folder, fullMatch } of replacements) {
      const files = await (await runtime.projectRoot())
        .join("snippets", folder)
        .files({ recursive: true });
      const has_tabs = files.length > 1;

      replacement = has_tabs ? "%%% " : "";

      const [filenamer] = files.filter(file => file.name === "filename.ts");
      const has_filename = filenamer !== undefined;
      const to_filename = has_filename
        ? await filenamer.import("default")
        : () => "";

      const snippets = files
        .filter(file => file.name !== "filename.ts")
        .toSorted((a, b) =>
          sorting.indexOf(a.core) < sorting.indexOf(b.core) ? -1 : 1);

      if (has_tabs) {
        replacement += snippets
          .map(file =>
            trim(file.name.slice(0, -file.fullExtension.length))
            + (has_filename ? `:${to_filename(file)}` : ""),
          ).join(", ");
        replacement += "\n\n";
      }

      const is_sh = (file: FileRef) => file.extension === ".sh" ? "$ " : "";

      for (const file of snippets) {
        if (!has_tabs) {
          replacement += "\n\n";
        }
        replacement += `\`\`\`${file.extension.slice(1)}\n${is_sh(file)}${await file.text()}\`\`\`\n\n`;
      }

      if (has_tabs) {
        replacement += "\n%%%";
      }

      replaced = replaced.replace(fullMatch, replacement);
    }

    return replaced;
  },
};
