import MySQL from "#MySQL";

import core_test from "@primate/core/db/test";

type Work = () => Promise<unknown>;

core_test(new MySQL({ database: "primate", username: "primate" }));
