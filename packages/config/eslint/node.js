/**
 * DeLaw ESLint config for Node services (Fastify API, shared libraries).
 */
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [require.resolve("./base.js")],
  env: {
    node: true,
    es2022: true,
  },
};
