const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");
const globals = require("globals");

module.exports = tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**", "*.config.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.test.json"],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "error",

      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

      eqeqeq: ["error", "always"],
      "no-debugger": "error",

      // CRITICAL: stdout is the stdio transport. Writing to it corrupts the
      // JSON-RPC stream and silently kills the connection. Log via the pino
      // logger (which writes to stderr) instead.
      "no-console": "error",
    },
  },
  {
    // structuredContent must be assignable to `{ [key: string]: unknown }`.
    // Named interfaces have no implicit index signature in TypeScript, so the
    // domain models are the one place that must use `type` aliases.
    files: ["src/types/models.ts"],
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off",
    },
  },
  {
    files: ["__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  }
);
