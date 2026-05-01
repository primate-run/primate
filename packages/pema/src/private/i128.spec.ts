import i128 from "#i128";
import spec from "#spec/bigint";

spec(i128, -(2n ** 127n), 2n ** 127n - 1n);
