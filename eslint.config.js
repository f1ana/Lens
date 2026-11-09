import js from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import perfectionist from 'eslint-plugin-perfectionist'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactEffect from 'eslint-plugin-react-you-might-not-need-an-effect'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import testingLibrary from 'eslint-plugin-testing-library'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const comments = {
  rules: {
    'no-doc-blocks': {
      meta: {
        messages: { doc: 'Use // for one line or /* */ for several, not /**.' },
        schema: [],
        type: 'suggestion',
      },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              if (comment.type === 'Block' && comment.value.startsWith('*'))
                context.report({ loc: comment.loc, messageId: 'doc' })
            }
          },
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores(['dist', 'src/components/ui']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      reactEffect.configs.recommended,
      jsxA11y.flatConfigs.strict,
      prettier,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      comments,
      perfectionist,
      react,
      'simple-import-sort': simpleImportSort,
    },
    // 'detect' needs getFilename, which ESLint 10 removed; match package.json
    settings: { react: { version: '19.3' } },
    rules: {
      'comments/no-doc-blocks': 'error',
      'multiline-comment-style': ['error', 'starred-block'],
      // Only types and JSX props are sorted; other order carries meaning
      'perfectionist/sort-interfaces': ['error', { type: 'natural' }],
      'perfectionist/sort-jsx-props': ['error', { type: 'natural' }],
      'perfectionist/sort-object-types': ['error', { type: 'natural' }],
      'perfectionist/sort-union-types': ['error', { type: 'natural' }],
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreArrowShorthand: true },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      eqeqeq: 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-nested-ternary': 'error',
      'react/button-has-type': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-leaked-render': [
        'error',
        { validStrategies: ['ternary', 'coerce'] },
      ],
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/no-array-index-key': 'error',
      'react/no-multi-comp': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/self-closing-comp': 'error',
    },
  },
  {
    files: ['src/app/**', 'src/hooks/**', 'src/storage/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/formats/*'],
              message: 'The page reads logs through @/formats and the model.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/formats/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/components/*', '@/hooks/*', '@/storage/*'],
              message:
                'Formats produce the model and know nothing of the page.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/model/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/*'],
              message: 'The model depends on nothing else in Lens.',
            },
          ],
        },
      ],
    },
  },
  {
    // Generators are CLI tools; stdout is their output.
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    extends: [vitest.configs.recommended, testingLibrary.configs['flat/react']],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // Some expects are conditional on purpose, in loops and after narrowing
      'vitest/no-conditional-expect': 'off',
      // expectHeading asserts for its callers
      'vitest/expect-expect': [
        'error',
        { assertFunctionNames: ['expect', 'expectHeading'] },
      ],
      // expect(x, message) adds a failure message
      'vitest/valid-expect': ['error', { maxArgs: 2 }],
      // Some tests query one render's container, or elements with no role
      'testing-library/no-container': 'off',
      'testing-library/no-node-access': 'off',
      'testing-library/prefer-screen-queries': 'off',
      // Fires on factories such as renderShip, which return no render result.
      'testing-library/render-result-naming-convention': 'off',
    },
  },
])
