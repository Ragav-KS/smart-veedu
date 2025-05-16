import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { configs as tsESlintConfigs } from 'typescript-eslint';

/**
 * @type {import('eslint').Linter.Config}
 */
export const baseConfig = [
  {
    ignores: [
      'dist/**/*.ts',
      'dist/**',
      '**/*.mjs',
      'eslint.config.mjs',
      '**/*.js',
    ],
  },
  eslint.configs.recommended,
  stylistic.configs.recommended,
  ...tsESlintConfigs.strictTypeChecked,
  ...tsESlintConfigs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parser: tsESlintConfigs.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/quotes': ['error', 'single'],
    },
  },
];
