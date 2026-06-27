/**
 * DeLaw ESLint config for the Next.js web app.
 * Adds Next.js core-web-vitals rules on top of the shared base.
 */
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    require.resolve("./base.js"),
    "next/core-web-vitals",
  ],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
};
