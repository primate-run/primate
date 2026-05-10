export const format: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

export const date = (epoch: string) => new Date(epoch).toLocaleDateString("en-AU", format);
