import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['dist/', 'node_modules/', 'skills/', 'agent-skills/', 'ui-ux-pro-max-skill/', '.claude/'],
  },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // TypeScript đã kiểm tra biến chưa khai báo
      'no-undef': 'off',
    },
  },
]
