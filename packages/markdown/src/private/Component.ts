import type { Dict } from "@rcompat/type";

type Component = {
  md: string;
  html: string;
  meta: Dict | null;
  toc: {
    depth: number;
    slug: string;
    text: string;
  }[];
};

export type { Component as default };
