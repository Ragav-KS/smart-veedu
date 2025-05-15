import { baseConfig } from '@smart-veedu/eslint-config';
import { globalIgnores } from 'eslint/config';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/no-useless-constructor': 'off',
    },
  },
  globalIgnores(['assets/*']),
];
