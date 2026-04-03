import migrate from "@primate/core/db/migrate";
import log from "@primate/core/log";

export default async function command_migrate_apply() {
  try {
    await migrate.apply();
  } catch (cause) {
    log.error(cause);
  }
};
