import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
import globals from 'globals';

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.next/**',
      '**/build/**',
      'pnpm-lock.yaml',
    ],
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      security: securityPlugin,
    },
    rules: {
      // Disable base rules that TypeScript handles
      'no-unused-vars': 'off',
      'no-undef': 'off',

      // TypeScript strict rules
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Import ordering - builtin → external → internal
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',

      // Security plugin rules
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'warn',

      // General best practices
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },

  // Next.js / Dashboard specific configuration
  {
    files: ['dashboard/**/*.ts', 'dashboard/**/*.tsx', 'dashboard/**/*.js', 'dashboard/**/*.jsx'],
    plugins: {
      '@next/next': nextPlugin,
    },
    settings: {
      next: {
        rootDir: 'dashboard',
      },
    },
    rules: {
      // Next.js recommended rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // Disable pages-specific rule (we use App Router)
      '@next/next/no-html-link-for-pages': 'off',

      // Disable explicit return type for React components (common pattern)
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // JavaScript/Config files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  // Prettier config MUST BE LAST to override conflicting rules
  prettierConfig,
];
