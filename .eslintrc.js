module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'boundaries'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  settings: {
    'boundaries/elements': [
      { type: 'core', pattern: 'packages/backend/src/core/**' },
      { type: 'shared', pattern: 'packages/backend/src/shared/**' },
      { type: 'module-public', pattern: 'packages/backend/src/modules/*/*.facade.ts' },
      { type: 'module-internal', pattern: 'packages/backend/src/modules/*/(domain|application|infrastructure|presentation)/**' },
    ],
  },
  rules: {
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          // Internal module code can import from core, shared, and public facades of OTHER modules
          { 
            from: 'module-internal', 
            allow: ['core', 'shared', 'module-public'] 
          },
          // Internal module code can import anything within its OWN module
          { 
            from: 'module-internal', 
            allow: ['./**'] 
          },
          // Core and Shared shouldn't depend on specific modules
          {
            from: ['core', 'shared'],
            disallow: ['module-internal', 'module-public']
          }
        ],
      },
    ],
  },
};
