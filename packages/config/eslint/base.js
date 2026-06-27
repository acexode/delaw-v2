/**
 * DeLaw base ESLint config — shared TypeScript rules.
 * Consumed by the Next.js (web) and Node (api) presets.
 */
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/consistent-type-imports": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
  ignorePatterns: ["node_modules/", "dist/", ".next/", ".turbo/"],
};
