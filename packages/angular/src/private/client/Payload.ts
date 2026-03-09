import type { Mode } from "@primate/core";
import type { Dict } from "@rcompat/type";

type Payload = {
  views: string[];
  props: Dict[];
  mode: Mode;
};

export default Payload;
