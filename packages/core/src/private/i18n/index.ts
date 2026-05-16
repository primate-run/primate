import config from "#i18n/config";
import locale from "#i18n/locale";
import internal from "#i18n/symbol/internal";

export type { default as API } from "#i18n/API";
export type { default as Catalogs } from "#i18n/Catalogs";
export type { default as ContextData } from "#i18n/ContextData";

type Index = typeof config & { locale: typeof locale };

const index: Index = config as any;
index.locale = locale;

export default index;

export { internal };
