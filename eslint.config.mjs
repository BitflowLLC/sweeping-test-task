import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {
      js,
      prettier: prettierPlugin, // add prettier plugin here
    },
    extends: [
      'js/recommended',
      // eslint-config-prettier disables ESLint rules that conflict with prettier
      // eslint-config-prettier uses standard config style, so include via spreads below:
      ...prettierConfig,
    ],
    rules: {
      // Run prettier as an ESLint rule and show issues as errors
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
]);
