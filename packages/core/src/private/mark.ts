import dim from "@rcompat/cli/color/dim";
import FileRef from "@rcompat/fs/FileRef";

const stringify = (params: unknown[]) => params.map(param => {
  if (param instanceof FileRef) {
    return param.toString();
  }
  if (param instanceof Error) {
    return param.message;
  }
  return param as string;
});

export default (format: string, ...params: unknown[]) =>
  stringify(params).reduce((formatted, param, i) =>
    formatted.replace(`{${i}}`, dim(param)), format);
