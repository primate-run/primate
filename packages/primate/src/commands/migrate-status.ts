import migrate from "@primate/core/db/migrate";
import log from "@primate/core/log";

export default async function command_migrate_status() {
  try {
    await migrate.status();
  } catch (cause) {
    log.error(cause);
  }
};
