const { FlatCompat } = require('@eslint/eslintrc')
const compat = new FlatCompat({
  // baseDirectory defaults to process.cwd(); override if necessary
  baseDirectory: __dirname,
})

module.exports = [
  // Global ignore patterns (replaces .eslintignore)
  {
    ignores: ['node_modules/**', 'out/**', 'dist/**', '**/dist/**', 'coverage/**', '*.config.js'],
  },

  // Include shareable configs via FlatCompat
  ...compat.extends('standard', 'plugin:prettier/recommended'),

  // Jest tests: provide `jest` globals
  {
    files: ['**/__tests__/**', '**/*.test.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        afterAll: 'readonly',
        beforeAll: 'readonly',
        expect: 'readonly',
      },
    },
  },

  // Renderer (browser) code
  {
    files: ['renderer/**/*.js', 'renderer/**/*.jsx'],
    languageOptions: {
      globals: {
        alert: 'readonly',
        confirm: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        Image: 'readonly',
        CSS: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },

  // Main (Node/electron) code
  {
    files: ['main/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
  },

  // Project-specific JS rules
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    plugins: {
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  // Jest setup file (gives access to jest globals)
  {
    files: ['jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly', beforeEach: 'readonly', afterEach: 'readonly' },
    },
  },

  // Relax unused-vars for main and renderer files (many are used indirectly by HTML or Electron lifecycle)
  {
    files: ['main/**/*.js', 'renderer/**/*.js', 'renderer/**/*.jsx'],
    rules: { 'no-unused-vars': 'warn' },
  },
]
