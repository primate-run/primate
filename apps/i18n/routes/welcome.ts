import route from "primate/route";
import i18n from "#i18n";

route.get(() => i18n("welcome", { name: "John", count: 5 }));
