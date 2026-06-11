/** Bun resolves .html imports to a bundled HTMLBundle at runtime (Bun.serve routes). */
declare module "*.html" {
  const bundle: import("bun").HTMLBundle;
  export default bundle;
}
