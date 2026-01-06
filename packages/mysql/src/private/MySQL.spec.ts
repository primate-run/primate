import MySQL from "#MySQL";
import test from "@primate/core/db/test";

test(new MySQL({ database: "primate", username: "primate" }));
