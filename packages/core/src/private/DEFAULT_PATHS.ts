export default {
  "#route/*": ["routes/*"],
  "#view/*": ["views/*", "views/*.tsx", "views/*.jsx"],
  "#store/*": ["stores/*", "stores/*.ts", "stores/*.js"],
  "#locale/*": ["locales/*", "locales/*.ts", "locales/*.js"],
  "#config/*": ["config/*", "config/*.ts", "config/*.js"],
  "#static/*": ["static/*", "static/*.ts", "static/*.js"],
  "#database/*": ["config/database/*.ts", "config/database/*.js"],
  "#app": ["config/app.ts", "config/app.js"],
  "#session": ["config/session.ts", "config/session.js"],
  "#i18n": ["config/i18n.ts", "config/i18n.js"],
  "#database": [
    "config/database/index.ts",
    "config/database/index.js",
    "config/database/default.js",
    "config/database/default.ts",
  ],
};

