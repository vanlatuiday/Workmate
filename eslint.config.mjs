import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

// Cùng bộ luật với frontend (eslint.config.mjs bên đó), áp cho code NestJS + script + test
export default [
  {
    ignores: ['dist/', 'node_modules/', 'storage/', 'backups/'],
  },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser },
    rules: {
      // TypeScript đã kiểm tra biến chưa khai báo
      'no-undef': 'off',
    },
  },
  {
    // Script .mjs chạy bằng Node
    files: ['**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly', URL: 'readonly', Buffer: 'readonly', fetch: 'readonly' } },
  },
]
