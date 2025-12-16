import type { TransformOptions } from "esbuild";

const angular: TransformOptions = {
  loader: "ts",
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
    },
  },
};

const react: TransformOptions = {
  jsx: "automatic",
  loader: "tsx",
};

const solid: TransformOptions = {
  format: "esm",
  jsx: "preserve",
  loader: "tsx",
  target: "esnext",
};

const typescript: TransformOptions = {
  loader: "ts",
};

const voby: TransformOptions = {
  jsx: "automatic",
  loader: "tsx",
  tsconfigRaw: {
    compilerOptions: {
      jsx: "react-jsx",
      jsxImportSource: "voby",
    },
  },
};

export default {
  angular,
  react,
  solid,
  typescript,
  voby,
} as const;
