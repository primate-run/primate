import type Catalog from "#i18n/Catalog";

export default function locale<const M extends Catalog>(messages: M): M {
  return messages;
}
