import i18n from "#i18n";
import route from "primate/route";

route.get(() => i18n("foo.bar", { s: 4 }));
