// ESLint-Konfiguration (flaches Format).
// Hinweis fuer Android/Termux: Werkzeuge werden ueber `node <pfad>` gestartet, weil die
// Shebangs in node_modules/.bin auf /usr/bin/env verweisen, das es dort nicht gibt.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  URL: "readonly",
  Buffer: "readonly",
};

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "android/build/**", "*.min.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: nodeGlobals },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: { globals: nodeGlobals },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
);
