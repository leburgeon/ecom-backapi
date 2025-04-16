import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from "@stylistic/eslint-plugin";

export default tseslint.config({
  files: ['**/*.ts'],
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  plugins: {
    "@stylistic": stylistic,
  },
  rules: {
    '@typescript-eslint/no-unsafe-assignment': 'off', // Disabled
    '@typescript-eslint/no-explicit-any': 'off', // Disabled
    '@typescript-eslint/no-unsafe-member-access': 'off', // Disabled
    '@typescript-eslint/no-unsafe-argument': 'off', // Disabled
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { 'argsIgnorePattern': '^_' }
    ],
    '@typescript-eslint/no-floating-promises': 'off', // Disabled
    '@typescript-eslint/no-unused-expressions': 'off', // Disabled
    '@typescript-eslint/require-await': 'off', // Disabled
    '@typescript-eslint/no-misused-promises': 'off', // Disabled
    '@typescript-eslint/no-base-to-string': 'off', // Disabled
  },
});