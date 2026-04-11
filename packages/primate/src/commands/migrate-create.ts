import core from "@primate/core";
import migrate from "@primate/core/db/migrate";
import error from "@rcompat/error";
import runtime from "@rcompat/runtime";
import type Command from "./Command.js";

const name_flag = "--name";

function create_requires_name_flag() {
  return error.template`migrate:create requires a ${name_flag} flag`;
}

const errors = error.coded({
  create_requires_name_flag,
});

const command_migrate_create: Command = async () => {
  const name = runtime.flags.try(name_flag);
  core.try(async () => {
    if (name === undefined) throw errors.create_requires_name_flag();
    await migrate.create(name);
  });
};
export default command_migrate_create;
