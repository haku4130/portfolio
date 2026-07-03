// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@stylistic/quote-props': 'off',
    '@stylistic/arrow-parens': 'off',
    '@stylistic/operator-linebreak': 'off',
    'vue/html-self-closing': ['error', { html: { void: 'any' } }],
    'vue/max-attributes-per-line': 'off'
  }
})
