// Minimal ESLint flat config: syntax parsing only, no style rules.
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
    },
    rules: {},
  },
];
