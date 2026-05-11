const globals = require('globals');
const js = require('@eslint/js');

const sharedRules = {
  ...js.configs.recommended.rules,
  // Express-Middleware-Signaturen lassen Parameter ungenutzt; allow leading underscore.
  'no-unused-vars': ['warn', {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrors: 'all',
    caughtErrorsIgnorePattern: '^_'
  }],
  // catch (_) ohne Verwendung ist legitim für Try-Ignore-Patterns.
  'no-empty': ['warn', { allowEmptyCatch: true }],
  // Server-Logging ist gewollt.
  'no-console': 'off'
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'data/**',
      'templates/**',
      '*.backup-*',
      '*.bak*'
    ]
  },
  // Server-Side: Node.js CommonJS
  {
    files: ['server.js', 'config.js', 'db.js', 'auth.js', 'lib/**/*.js', 'routes/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: sharedRules
  },
  // ESLint-Config selbst.
  {
    files: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: sharedRules
  },
  // Frontend-Code: Browser-Globals + zur Laufzeit aus frontend-utils.js bereitgestellte Helper.
  {
    files: ['formular.js', 'frontend-utils.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        RequiredFields: 'readonly',
        showToast: 'readonly',
        confirmAction: 'readonly',
        escapeHtml: 'readonly'
      }
    },
    rules: sharedRules
  },
  // UMD-Modul: Node + Browser.
  {
    files: ['required-fields.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'script',
      globals: { ...globals.node, ...globals.browser }
    },
    rules: sharedRules
  }
];
