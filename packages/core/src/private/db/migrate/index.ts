import apply from "#db/migrate/apply";
import create from "#db/migrate/create";
import status from "#db/migrate/status";

const migrate = { apply, create, status };

export default migrate;
