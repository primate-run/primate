import error from "@rcompat/error";

const t = error.template;

function document_not_found(id: string) {
  return t`Markdown document ${id} not found`;
}

const errors = error.coded({
  document_not_found,
});

export const Code = error.names(errors);
export type Code = keyof typeof errors;

export default errors;
