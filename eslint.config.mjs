// @ts-check
import globals from "globals";
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      complexity: [1, 8],
      "consistent-return": 0,
      "eol-last": 1,
      "key-spacing": 0,
      "max-depth": [1, 3],
      "max-nested-callbacks": [2, 3],
      "max-params": [1, 4],
      "no-multi-spaces": 0,
      "no-trailing-spaces": 1,
      "no-underscore-dangle": 0,
      "no-unused-vars": 1,
      "space-before-function-paren": [1, "never"],
      "@typescript-eslint/no-this-alias": "off",
      semi: "warn",
    },
  },
);
