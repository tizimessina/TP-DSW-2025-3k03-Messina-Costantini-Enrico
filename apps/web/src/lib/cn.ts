/** Une clases condicionales sin dependencias externas. */
export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
