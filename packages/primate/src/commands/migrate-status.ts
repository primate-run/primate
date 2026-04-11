import core from "@primate/core";
import migrate from "@primate/core/db/migrate";
import type Command from "./Command.js";

const command_migrate_status: Command = async () => {
  core.try(async () => {
    await migrate.status();
  });
};

export default command_migrate_status;
