import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Layer boundaries: dependencies may only point inward. */
const forbid = (...groups) => ({
  "no-restricted-imports": [
    "error",
    { patterns: groups.map(([group, message]) => ({ group, message })) },
  ],
});

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "node_modules/**", "next-env.d.ts", "coverage/**"]),
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: forbid([
      ["@/application/*", "@/infrastructure/*", "@/presentation/*", "@/composition", "react", "next/*"],
      "The domain layer must not depend on outer layers or frameworks.",
    ]),
  },
  {
    files: ["src/application/**/*.{ts,tsx}"],
    rules: forbid([
      ["@/infrastructure/*", "@/presentation/*", "@/composition", "react", "next/*"],
      "The application layer depends on domain contracts only.",
    ]),
  },
  {
    files: ["src/infrastructure/**/*.{ts,tsx}"],
    rules: forbid([
      ["@/presentation/*", "@/application/*", "@/composition", "react", "next/*"],
      "Infrastructure implements domain contracts and must not know about the UI or use cases.",
    ]),
  },
  {
    files: ["src/presentation/**/*.{ts,tsx}"],
    rules: forbid([
      ["@/infrastructure/*"],
      "The UI must not import concrete implementations. Wire them in src/composition.ts.",
    ]),
  },
]);
