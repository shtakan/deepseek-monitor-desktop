// Minimal ESLint flat config: syntax parsing only, no style rules.
export default [
  {
    // Vendor / generated files: maintained upstream or emitted by build-pake-bundle.js.
    // pdf.worker.js is ESM vendor code, so parsing it as commonjs fails.
    ignores: [
      'ai-context-monitor/pdf.worker.js',
      'ai-context-monitor/lib/**',
      'ai-context-monitor/pake-bundle.deepseek.js',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
    },
    rules: {},
  },
];
