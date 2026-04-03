import migrate from "@primate/core/db/migrate";
import log from "@primate/core/log";
import error from "@rcompat/error";

const n = "--name";

function create_requires_name_flag() {
  return error.template`migrate:create requires a ${n} flag`;
}

const errors = error.coded({
  create_requires_name_flag,
});

export default async function command_migrate_create(flags: string[]) {
  const name = flags.find(f => f.startsWith(`${n}=`))?.slice(`${n}=`.length);
  try {
    if (name === undefined) throw errors.create_requires_name_flag();
    await migrate.create(name);
  } catch (cause) {
    log.error(cause);
  }
};
